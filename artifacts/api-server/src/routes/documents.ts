import { Router } from "express";
import { db, documentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";
import { generateLegalDocument, getDocumentPrice, getDocumentTitle } from "../utils/aiGenerator.js";
import { generatePDF } from "../utils/pdfGenerator.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const docs = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.userId, req.userId!));

    res.json(docs.map(d => ({
      ...d,
      content: d.paid ? d.content : d.content ? d.content.substring(0, 200) + "..." : null,
    })));
  } catch (err) {
    req.log.error({ err }, "List documents error");
    res.status(500).json({ error: "Failed to list documents" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { type, formData, language = "en" } = req.body as {
      type: string;
      formData: Record<string, unknown>;
      language: string;
    };

    if (!type || !formData) {
      res.status(400).json({ error: "Document type and form data are required" });
      return;
    }

    const price = getDocumentPrice(type);
    const title = getDocumentTitle(type);

    const content = await generateLegalDocument(type, formData, language);

    const [doc] = await db.insert(documentsTable).values({
      userId: req.userId!,
      type,
      title,
      content,
      formData,
      paid: false,
      language,
      price,
    }).returning();

    res.json({
      ...doc,
      content: doc.content ? doc.content.substring(0, 300) + "..." : null,
    });
  } catch (err) {
    req.log.error({ err }, "Generate document error");
    res.status(500).json({ error: "Failed to generate document" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const docs = await db.select()
      .from(documentsTable)
      .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, req.userId!)))
      .limit(1);

    if (docs.length === 0) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const doc = docs[0];
    res.json({
      ...doc,
      content: doc.paid ? doc.content : doc.content ? doc.content.substring(0, 500) + "\n\n[Content blurred - Purchase to view full document]" : null,
    });
  } catch (err) {
    req.log.error({ err }, "Get document error");
    res.status(500).json({ error: "Failed to get document" });
  }
});

router.get("/:id/download", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const docs = await db.select()
      .from(documentsTable)
      .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, req.userId!)))
      .limit(1);

    if (docs.length === 0) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const doc = docs[0];
    if (!doc.paid) {
      res.status(403).json({ error: "Payment required to download this document" });
      return;
    }

    const pdfBuffer = await generatePDF(doc.content || "", doc.title, false);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.title.replace(/\s+/g, "-")}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    req.log.error({ err }, "Download document error");
    res.status(500).json({ error: "Failed to download document" });
  }
});

export default router;
