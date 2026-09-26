/**
 * EditDocument.tsx — 7-day edit access (NOT a refund).
 * A paid buyer opens /documents/edit?token=<editToken>, corrects their
 * inputs, and regenerates the document. The server validates everything,
 * appends a new document version, and issues a fresh download token.
 * No account or login required — the edit token is the credential.
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, PenLine, CheckCircle2, Loader2, Download,
  AlertTriangle, Clock, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCUMENTS } from "@/lib/constants";
import { getFieldConfig, INDIAN_STATES } from "@/lib/fieldConfig";
import { guestFetch } from "@/hooks/use-guest-fetch";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface EditDoc {
  docType: string;
  title: string;
  formData: Record<string, string>;
  language: string;
  editExpiresAt: string;
}

function EditField({
  fieldKey, value, onChange,
}: {
  fieldKey: string; value: string; onChange: (v: string) => void;
}) {
  const config = getFieldConfig(fieldKey);
  const base =
    "w-full bg-background/60 border border-white/20 text-white text-base px-4 py-3 rounded-xl " +
    "focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 " +
    "placeholder:text-muted-foreground/50 transition-all";
  const label = config.question.replace(/\?$/, "");

  return (
    <label className="block">
      <span className="block text-sm font-medium text-white mb-1.5">
        {config.emoji ? `${config.emoji} ` : ""}{label}
      </span>
      {config.type === "textarea" ? (
        <textarea className={base + " resize-none min-h-[110px]"} value={value}
          onChange={(e) => onChange(e.target.value)} rows={4} />
      ) : config.type === "select" ? (
        <select className={base + " cursor-pointer"} value={value}
          onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {(config.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={config.type === "date" ? "date" : config.type === "currency" || config.type === "number" ? "number" : "text"}
          className={base + (config.type === "date" ? " [color-scheme:dark]" : "")}
          value={value} onChange={(e) => onChange(e.target.value)}
          min={config.min} max={config.max}
        />
      )}
      {fieldKey === "state" && !config.options && (
        <datalist id="edit-states">
          {INDIAN_STATES.map((s) => <option key={s} value={s} />)}
        </datalist>
      )}
    </label>
  );
}

export default function EditDocument() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [doc, setDoc] = useState<EditDoc | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [regenerating, setRegenerating] = useState(false);
  const [result, setResult] = useState<{ downloadUrl: string; version: string } | null>(null);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    guestFetch(`${BASE}/api/documents/edit/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.status === 410) { setExpired(true); return; }
        if (!res.ok) { setNotFound(true); return; }
        const data = (await res.json()) as EditDoc;
        setDoc(data);
        setFormData(data.formData ?? {});
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const docConfig = doc ? DOCUMENTS[doc.docType as keyof typeof DOCUMENTS] : undefined;
  const fields: string[] = docConfig?.fields ?? [];

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await guestFetch(`${BASE}/api/documents/edit/regenerate`, {
        method: "POST",
        body: JSON.stringify({ editToken: token, formData }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        if (res.status === 410) { setExpired(true); return; }
        throw new Error((e as any).error || "Regeneration failed");
      }
      const data = await res.json();
      setResult({ downloadUrl: `${BASE}${data.downloadUrl}`, version: data.version });
      toast({ title: "Document regenerated", description: `Version ${data.version} is ready.` });
    } catch (err: any) {
      toast({ title: "Regeneration failed", description: err.message, variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">Edit access expired</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Free edits are available for 7 days after payment. This window has closed —
            you can generate a fresh document any time.
          </p>
          <Button onClick={() => setLocation("/documents")}>Browse Templates</Button>
        </div>
      </div>
    );
  }

  if (notFound || !doc) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">Link not valid</h1>
          <p className="text-muted-foreground text-sm mb-6">
            This edit link is invalid or has been revoked.
          </p>
          <Button onClick={() => setLocation("/documents")}>Browse Templates</Button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-card border border-white/10 rounded-3xl p-8 text-center">
          <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-1">Regenerated!</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Version {result.version} of your {doc.title} is ready.
          </p>
          <Button onClick={() => window.open(result.downloadUrl, "_blank")}
            className="w-full h-12 bg-primary text-primary-foreground font-bold mb-3">
            <Download className="mr-2 h-4 w-4" /> Download new PDF
          </Button>
          <Button onClick={() => setLocation("/documents")} variant="ghost" className="w-full">
            Generate Another Document
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-white/10 bg-card/80 backdrop-blur px-5 py-3 flex items-center gap-4 sticky top-0 z-20">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/documents")}
          className="text-muted-foreground hover:text-white h-8 w-8 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm flex items-center gap-2">
            <PenLine className="h-4 w-4 text-primary" /> Edit: {doc.title}
          </p>
          <p className="text-xs text-muted-foreground">
            Free edits until {new Date(doc.editExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-card border border-white/10 rounded-2xl p-6 mb-6 flex items-start gap-3">
          <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Correct any details below and regenerate. Your original version stays saved —
            each regeneration creates a new version of the same document.
          </p>
        </div>

        <div className="space-y-5">
          {fields.map((f) => (
            <EditField key={f} fieldKey={f} value={formData[f] ?? ""}
              onChange={(v) => setFormData((p) => ({ ...p, [f]: v }))} />
          ))}
        </div>

        <Button onClick={handleRegenerate} disabled={regenerating}
          className="w-full h-14 mt-8 text-base font-bold bg-primary text-primary-foreground shadow-gold">
          {regenerating ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <PenLine className="mr-2 h-5 w-5" />}
          {regenerating ? "Regenerating…" : "Regenerate Document"}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Regeneration is free within your 7-day edit window.
        </p>
      </div>
    </div>
  );
}
