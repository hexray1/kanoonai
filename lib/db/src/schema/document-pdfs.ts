import { pgTable, uuid, customType, timestamp } from "drizzle-orm/pg-core";
import { guestDocumentsTable } from "./guest-documents";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/**
 * Final PDFs in private storage (Postgres bytea — never a public file/URL).
 * Download happens only through short-lived, hashed, revocable tokens
 * (download_tokens). Regenerated on every paid edit.
 */
export const documentPdfsTable = pgTable("document_pdfs", {
  documentId: uuid("document_id").primaryKey().references(() => guestDocumentsTable.id),
  pdfData:    bytea("pdf_data").notNull(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});

export type DocumentPdf = typeof documentPdfsTable.$inferSelect;
