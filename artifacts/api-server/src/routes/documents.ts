import { Router } from "express";
import { db, documentsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";
import {
  generateLegalDocumentStream,
  generateLegalDocument,
  getDocumentPrice,
  getDocumentTitle,
} from "../utils/aiGenerator.js";
import { generatePDF } from "../utils/pdfGenerator.js";

const router = Router();

// ─── PUBLIC: Guest streaming (no auth, no DB save) ──────────────────────────
router.post("/stream/guest", async (req, res) => {
  const { type, formData, language = "en" } = req.body as {
    type: string;
    formData: Record<string, unknown>;
    language: string;
  };

  if (!type || !formData) {
    res.status(400).json({ error: "type and formData required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    for await (const chunk of generateLegalDocumentStream(type, formData, language)) {
      send({ chunk });
    }
    send({
      done: true,
      title: getDocumentTitle(type),
      price: getDocumentPrice(type),
    });
  } catch (err: any) {
    send({ error: err?.message || "Generation failed" });
  } finally {
    res.end();
  }
});

// ─── All routes below require auth ──────────────────────────────────────────
router.use(authMiddleware);

// List user's documents
router.get("/", async (req: AuthRequest, res) => {
  try {
    const docs = await db.select().from(documentsTable)
      .where(eq(documentsTable.userId, req.userId!))
      .orderBy(desc(documentsTable.createdAt));
    res.json(docs.map((d) => ({
      ...d,
      content: d.paid ? d.content : d.content ? d.content.substring(0, 200) + "..." : null,
    })));
  } catch (err) {
    req.log.error({ err }, "list docs error");
    res.status(500).json({ error: "Failed to list documents" });
  }
});

// Get single document (auth user's own)
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number.parseInt(String(req.params.id), 10);
    const docs = await db.select().from(documentsTable)
      .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, req.userId!)))
      .limit(1);
    if (docs.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    const doc = docs[0];
    res.json({
      ...doc,
      content: doc.paid ? doc.content
        : doc.content ? doc.content.substring(0, 500) + "\n\n[Full document unlocks after payment]" : null,
    });
  } catch (err) {
    req.log.error({ err }, "get doc error");
    res.status(500).json({ error: "Failed to get document" });
  }
});

// Authenticated streaming (saves to DB automatically)
router.post("/stream", async (req: AuthRequest, res) => {
  const { type, formData, language = "en" } = req.body as {
    type: string; formData: Record<string, unknown>; language: string;
  };

  if (!type || !formData) {
    res.status(400).json({ error: "type and formData required" });
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
    const price = getDocumentPrice(type);
    const title = getDocumentTitle(type);

    for await (const chunk of generateLegalDocumentStream(type, formData, language)) {
      fullContent += chunk;
      send({ chunk });
    }

    const [doc] = await db.insert(documentsTable).values({
      userId: req.userId!,
      type, title, content: fullContent,
      formData, paid: false, language, price,
    }).returning();

    send({ done: true, docId: doc.id });
  } catch (err: any) {
    req.log.error({ err }, "stream error");
    send({ error: err?.message || "Generation failed" });
  } finally {
    res.end();
  }
});

// Save pre-generated content (after guest login redirect)
router.post("/from-content", async (req: AuthRequest, res) => {
  try {
    const { type, title, content, formData, language = "en", price } = req.body as {
      type: string; title: string; content: string;
      formData: Record<string, unknown>; language: string; price: number;
    };

    if (!type || !content) {
      res.status(400).json({ error: "type and content required" });
      return;
    }

    const [doc] = await db.insert(documentsTable).values({
      userId: req.userId!,
      type,
      title: title || getDocumentTitle(type),
      content,
      formData: formData ?? {},
      paid: false,
      language,
      price: price || getDocumentPrice(type),
    }).returning();

    res.json({ id: doc.id, title: doc.title, price: doc.price });
  } catch (err) {
    req.log.error({ err }, "from-content error");
    res.status(500).json({ error: "Failed to save document" });
  }
});

// Non-streaming fallback
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { type, formData, language = "en" } = req.body as {
      type: string; formData: Record<string, unknown>; language: string;
    };
    if (!type || !formData) {
      res.status(400).json({ error: "type and formData required" });
      return;
    }
    const price = getDocumentPrice(type);
    const title = getDocumentTitle(type);
    const content = await generateLegalDocument(type, formData, language);
    const [doc] = await db.insert(documentsTable).values({
      userId: req.userId!, type, title, content, formData, paid: false, language, price,
    }).returning();
    res.json({ ...doc, content: doc.content ? doc.content.substring(0, 300) + "..." : null });
  } catch (err) {
    req.log.error({ err }, "generate error");
    res.status(500).json({ error: "Failed to generate document" });
  }
});

// Download PDF (paid documents)
router.get("/:id/download", async (req: AuthRequest, res) => {
  try {
    const id = Number.parseInt(String(req.params.id), 10);
    const docs = await db.select().from(documentsTable)
      .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, req.userId!)))
      .limit(1);
    if (docs.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    const doc = docs[0];
    if (!doc.paid) { res.status(403).json({ error: "Payment required" }); return; }
    const pdfBuffer = await generatePDF(doc.content || "", doc.title, { watermark: false, documentId: doc.id });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.title.replace(/\s+/g, "-")}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    req.log.error({ err }, "download error");
    res.status(500).json({ error: "Failed to download" });
  }
});

export default router;
