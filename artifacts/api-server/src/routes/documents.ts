import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  guestSessionsTable,
  guestDocumentsTable,
  documentVersionsTable,
  documentPdfsTable,
  downloadTokensTable,
  editTokensTable,
} from "@workspace/db";
import {
  generateLegalDocumentStream,
  generateLegalDocument,
  repairLegalDocument,
  getDocumentPrice,
  getDocumentTitle,
  DOCUMENT_PRICES,
} from "../utils/aiGenerator.js";
import { generatePDF } from "../utils/pdfGenerator.js";
import {
  validateFormData,
  validateGeneratedContent,
  TEMPLATE_VERSION,
  PROMPT_VERSION,
  LEGAL_VERSION,
} from "../utils/documentConfig.js";
import { generateToken, hashToken, isTokenLive } from "../utils/tokens.js";
import {
  guestStreamRateLimit,
  downloadRateLimit,
  editRegenRateLimit,
} from "../middleware/rateLimit.js";
import { audit } from "../utils/audit.js";

const router = Router();

const SUPPORTED_LANGUAGES = new Set(["en", "hi", "mr", "ta", "te"]);
const DOWNLOAD_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const EDIT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — edit access, NOT a refund

function deviceKeyOf(req: any): string {
  const raw = String(req.headers["x-guest-token"] ?? "").slice(0, 100);
  return raw || "guest-fallback";
}

async function getSessionId(deviceKey: string): Promise<string> {
  const [row] = await db
    .insert(guestSessionsTable)
    .values({ deviceKey })
    .onConflictDoNothing({ target: guestSessionsTable.deviceKey })
    .returning({ id: guestSessionsTable.id });
  if (row) return row.id;
  const existing = await db
    .select({ id: guestSessionsTable.id })
    .from(guestSessionsTable)
    .where(eq(guestSessionsTable.deviceKey, deviceKey))
    .limit(1);
  return existing[0]!.id;
}

// ─── PUBLIC: Guest streaming (no auth) ───────────────────────────────────────
// Validates the smart-form server-side, streams the AI draft, then PERSISTS
// the generated document. The persisted copy is the only source the
// post-payment PDF is ever rendered from — the client is never trusted
// to supply final content after payment.
router.post("/stream/guest", guestStreamRateLimit, async (req, res) => {
  const { type, formData, language = "en" } = req.body as {
    type: string;
    formData: Record<string, unknown>;
    language: string;
  };

  if (!type || typeof type !== "string" || !(type in DOCUMENT_PRICES)) {
    res.status(400).json({ error: "A valid document type is required" });
    return;
  }
  const formCheck = validateFormData(type, formData);
  if (!formCheck.ok) {
    res.status(400).json({ error: formCheck.error });
    return;
  }
  if (!SUPPORTED_LANGUAGES.has(language)) {
    res.status(400).json({ error: "Unsupported language" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  let fullContent = "";

  try {
    for await (const chunk of generateLegalDocumentStream(type, formData, language)) {
      fullContent += chunk;
      send({ chunk });
    }

    const outCheck = validateGeneratedContent(fullContent);
    if (!outCheck.ok) {
      // One repair pass: regenerate from the partial draft, stream it too.
      send({ repairing: true });
      try {
        const repaired = await repairLegalDocument(type, formData, fullContent, language, outCheck.error ?? "incomplete");
        for (let i = 0; i < repaired.length; i += 2000) {
          const slice = repaired.slice(i, i + 2000);
          fullContent += slice;
          send({ chunk: slice });
        }
      } catch (repairErr: any) {
        send({ error: `Generation failed validation and repair did not succeed: ${repairErr?.message ?? "unknown"}` });
        return;
      }
      const recheck = validateGeneratedContent(fullContent);
      if (!recheck.ok) {
        send({ error: recheck.error });
        return;
      }
    }

    // Persist the server-generated document (source of truth for the PDF).
    const basePrice = getDocumentPrice(type);
    const totalPaise = (basePrice + Math.round(basePrice * 0.18)) * 100;
    const sessionId = await getSessionId(deviceKeyOf(req));
    const [doc] = await db
      .insert(guestDocumentsTable)
      .values({
        sessionId,
        docType: type,
        formData,
        content: fullContent,
        language,
        templateVersion: TEMPLATE_VERSION,
        promptVersion: PROMPT_VERSION,
        legalVersion: LEGAL_VERSION,
        pricePaise: totalPaise,
        status: "draft",
      })
      .returning({ id: guestDocumentsTable.id });
    await db.insert(documentVersionsTable).values({
      documentId: doc.id,
      version: "1",
      content: fullContent,
      formData: JSON.stringify(formData),
    });
    audit("document.generated", {
      documentId: doc.id,
      ip: req.ip,
      metadata: { type, language },
    }).catch(() => {});

    send({
      done: true,
      documentId: doc.id,
      title: getDocumentTitle(type),
      price: basePrice,
    });
  } catch (err: any) {
    send({ error: err?.message || "Generation failed" });
  } finally {
    res.end();
  }
});

// ─── PUBLIC: Tokenized PDF download (no auth — token is the credential) ─────
// Token must be cryptographically random (issued at payment), hashed in DB,
// unexpired, unrevoked. Rate-limited per IP.
router.get("/download/:token", downloadRateLimit, async (req, res) => {
  try {
    const raw = String(req.params.token ?? "");
    if (!raw || raw.length > 200) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const tokenHash = hashToken(raw);
    const rows = await db
      .select()
      .from(downloadTokensTable)
      .where(eq(downloadTokensTable.tokenHash, tokenHash))
      .limit(1);
    const tok = rows[0];
    // 404 for both missing and invalid/expired — no oracle for token probing.
    if (!tok || !isTokenLive(tok)) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const pdfs = await db
      .select()
      .from(documentPdfsTable)
      .where(eq(documentPdfsTable.documentId, tok.documentId))
      .limit(1);
    if (pdfs.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const docs = await db
      .select({ docType: guestDocumentsTable.docType })
      .from(guestDocumentsTable)
      .where(eq(guestDocumentsTable.id, tok.documentId))
      .limit(1);

    await db
      .update(downloadTokensTable)
      .set({ lastUsedAt: new Date() })
      .where(eq(downloadTokensTable.id, tok.id))
      .catch(() => {});
    audit("pdf.downloaded", {
      documentId: tok.documentId,
      ip: req.ip,
      metadata: { tokenId: tok.id },
    }).catch(() => {});

    const title = getDocumentTitle(docs[0]?.docType ?? "document");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${title.replace(/\s+/g, "-")}.pdf"`,
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.send(pdfs[0].pdfData);
  } catch (err) {
    res.status(500).json({ error: "Download failed" });
  }
});

// ─── PUBLIC: 7-day edit regeneration (no auth — edit token is credential) ───
// NOT a refund. Lets the buyer regenerate the paid document with corrected
// inputs within 7 days of payment. Creates a new version + new PDF + new
// download token. The edit token stays valid until expiry (multi-use).
router.post("/edit/regenerate", editRegenRateLimit, async (req, res) => {
  try {
    const { editToken, formData } = req.body as {
      editToken: string;
      formData: Record<string, unknown>;
    };
    if (!editToken || typeof editToken !== "string") {
      res.status(400).json({ error: "editToken is required" });
      return;
    }
    const tokenHash = hashToken(editToken);
    const rows = await db
      .select()
      .from(editTokensTable)
      .where(eq(editTokensTable.tokenHash, tokenHash))
      .limit(1);
    const tok = rows[0];
    if (!tok || !isTokenLive(tok)) {
      // 410 Gone for expired — lets the client explain the 7-day window.
      const gone = tok && !tok.revoked && tok.expiresAt.getTime() <= Date.now();
      res.status(gone ? 410 : 404).json({
        error: gone ? "Edit access expired (7-day window)" : "Not found",
      });
      return;
    }

    const docs = await db
      .select()
      .from(guestDocumentsTable)
      .where(eq(guestDocumentsTable.id, tok.documentId))
      .limit(1);
    const doc = docs[0];
    if (!doc || doc.status !== "paid") {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const formCheck = validateFormData(doc.docType, formData);
    if (!formCheck.ok) {
      res.status(400).json({ error: formCheck.error });
      return;
    }

    const content = await generateLegalDocument(doc.docType, formData, doc.language);
    const outCheck = validateGeneratedContent(content);
    if (!outCheck.ok) {
      res.status(500).json({ error: "Regeneration failed validation" });
      return;
    }

    const existing = await db
      .select({ version: documentVersionsTable.version })
      .from(documentVersionsTable)
      .where(eq(documentVersionsTable.documentId, doc.id))
      .orderBy(desc(documentVersionsTable.createdAt))
      .limit(1);
    const nextVersion = String((parseInt(existing[0]?.version ?? "0", 10) || 0) + 1);

    await db.insert(documentVersionsTable).values({
      documentId: doc.id,
      version: nextVersion,
      content,
      formData: JSON.stringify(formData),
    });
    await db
      .update(guestDocumentsTable)
      .set({ content, formData, updatedAt: new Date() })
      .where(eq(guestDocumentsTable.id, doc.id));

    const pdfBuffer = await generatePDF(content, getDocumentTitle(doc.docType), {
      watermark: false,
    });
    await db
      .insert(documentPdfsTable)
      .values({ documentId: doc.id, pdfData: pdfBuffer })
      .onConflictDoUpdate({
        target: documentPdfsTable.documentId,
        set: { pdfData: pdfBuffer, createdAt: new Date() },
      });

    await db
      .update(editTokensTable)
      .set({ usedCount: tok.usedCount + 1 })
      .where(eq(editTokensTable.id, tok.id));

    // Rotate the download token so old links stop working after an edit.
    await db
      .update(downloadTokensTable)
      .set({ revoked: true })
      .where(eq(downloadTokensTable.documentId, doc.id));
    const dlRaw = generateToken();
    await db.insert(downloadTokensTable).values({
      tokenHash: hashToken(dlRaw),
      documentId: doc.id,
      expiresAt: new Date(Date.now() + DOWNLOAD_TOKEN_TTL_MS),
    });

    audit("edit.regenerated", {
      documentId: doc.id,
      ip: req.ip,
      metadata: { version: nextVersion },
    }).catch(() => {});

    res.json({
      ok: true,
      version: nextVersion,
      downloadToken: dlRaw,
      downloadUrl: `/api/documents/download/${dlRaw}`,
      editExpiresAt: tok.expiresAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Regeneration failed" });
  }
});

// ─── PUBLIC: Edit-token document lookup (token is the credential) ────────────
// Returns the document type + saved inputs so the buyer can correct them.
// 404 for missing/invalid tokens (no oracle), 410 for expired tokens.
router.get("/edit/:token", async (req, res) => {
  try {
    const raw = String(req.params.token ?? "");
    if (!raw || raw.length > 200) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const rows = await db
      .select()
      .from(editTokensTable)
      .where(eq(editTokensTable.tokenHash, hashToken(raw)))
      .limit(1);
    const tok = rows[0];
    if (!tok || tok.revoked) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (tok.expiresAt.getTime() <= Date.now()) {
      res.status(410).json({ error: "Edit access expired (7-day window)" });
      return;
    }
    const docs = await db
      .select()
      .from(guestDocumentsTable)
      .where(eq(guestDocumentsTable.id, tok.documentId))
      .limit(1);
    const doc = docs[0];
    if (!doc || doc.status !== "paid") {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      docType: doc.docType,
      title: getDocumentTitle(doc.docType),
      formData: doc.formData,
      language: doc.language,
      editExpiresAt: tok.expiresAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Lookup failed" });
  }
});

export { DOWNLOAD_TOKEN_TTL_MS, EDIT_TOKEN_TTL_MS };
export default router;
