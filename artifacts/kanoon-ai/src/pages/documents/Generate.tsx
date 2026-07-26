/**
 * Generate.tsx — Full conversion-optimised flow:
 * Wizard → Guest AI Stream → Locked Preview → Login (if needed) → Payment → Download
 * No login required until AFTER the document has been generated.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Zap, Shield, Globe,
  Sparkles, ChevronRight, Eye, FileText, RotateCcw,
  Lock, FileDown, CheckCircle2, Loader2, Star,
  Download, PartyPopper, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCUMENTS, FIELD_LABELS } from "@/lib/constants";
import { getFieldConfig, INDIAN_STATES, type FieldConfig } from "@/lib/fieldConfig";
import { buildDocumentPreview } from "@/lib/documentTemplates";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { useAuthStore, authFetch, getAuthToken } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Types ────────────────────────────────────────────────────────────────────
type Phase = "wizard" | "streaming" | "locked" | "saving" | "payment" | "success";

interface PendingDoc {
  type: string;
  formData: Record<string, string>;
  content: string;
  language: string;
  title: string;
  price: number;
}

// ── Constants ────────────────────────────────────────────────────────────────
const PENDING_KEY = "kanoox_pending_doc";
const REDIRECT_KEY = "kanoon_redirect_after_login";

const STREAM_STAGES = [
  "Connecting to Llama 3.3 70B…",
  "Analysing Indian legal requirements…",
  "Drafting parties & recitals…",
  "Writing clauses & provisions…",
  "Applying jurisdiction rules…",
  "Finalising signatures & witness blocks…",
];

const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳" },
  { code: "mr", label: "मराठी", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳" },
];

// ── Razorpay helper ───────────────────────────────────────────────────────────
declare global { interface Window { Razorpay: any; } }

async function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

// ── Field input ───────────────────────────────────────────────────────────────
function FieldInput({
  fieldKey, config, value, onChange, onEnter,
}: {
  fieldKey: string; config: FieldConfig; value: string;
  onChange: (v: string) => void; onEnter: () => void;
}) {
  const placeholder = FIELD_LABELS[fieldKey]?.placeholder ?? "";
  const base =
    "w-full bg-background/60 border border-white/20 text-white text-lg px-5 py-4 rounded-xl " +
    "focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 " +
    "placeholder:text-muted-foreground/50 transition-all";

  const enter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && config.type !== "textarea") { e.preventDefault(); onEnter(); }
  };

  if (config.type === "select") {
    return (
      <select className={base + " cursor-pointer"} value={value}
        onChange={(e) => onChange(e.target.value)} autoFocus>
        <option value="">Select…</option>
        {(config.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (config.type === "textarea") {
    return <textarea className={base + " resize-none min-h-[140px]"} placeholder={placeholder}
      value={value} onChange={(e) => onChange(e.target.value)} rows={5} autoFocus />;
  }
  if (config.type === "date") {
    return <input type="date" className={base + " [color-scheme:dark]"} value={value}
      onChange={(e) => onChange(e.target.value)} onKeyDown={enter} autoFocus />;
  }
  return (
    <div className="relative">
      {config.prefix && (
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl text-muted-foreground font-medium pointer-events-none">
          {config.prefix}
        </span>
      )}
      <input
        type={config.type === "currency" || config.type === "number" ? "number" : "text"}
        className={base + (config.prefix ? " pl-10" : "")}
        placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={enter} min={config.min} max={config.max} autoFocus
      />
      {config.suffix && (
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          {config.suffix}
        </span>
      )}
    </div>
  );
}

// ── Locked Document Preview ───────────────────────────────────────────────────
function LockedDocPreview({ content, title }: { content: string; title: string }) {
  const lines = content.split("\n").filter(Boolean);
  const visibleCount = Math.min(18, Math.floor(lines.length * 0.28));
  const visible = lines.slice(0, visibleCount).join("\n");
  const blurred = lines.slice(visibleCount, visibleCount + 60).join("\n");

  return (
    <div className="relative bg-white text-[#1a1a2e] rounded-2xl shadow-2xl overflow-hidden min-h-[560px] font-serif select-none">
      {/* Paper header */}
      <div className="bg-[#0a0f1e] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#f5c518] flex items-center justify-center font-black text-[#0a0f1e] text-sm">K</div>
          <span className="text-[#f5c518] font-bold text-sm">Kanoox AI</span>
        </div>
        <span className="text-[#888] text-xs">DRAFT PREVIEW</span>
      </div>
      <div className="h-[3px] bg-[#f5c518]" />

      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <span style={{ transform: "rotate(-35deg)", fontSize: "72px", fontWeight: 900,
          color: "rgba(0,0,0,0.04)", whiteSpace: "nowrap", fontFamily: "sans-serif",
          letterSpacing: "6px" }}>
          KANOOX AI PREVIEW
        </span>
      </div>

      {/* Title */}
      <div className="relative z-10 bg-[#f8f4e8] border-l-4 border-[#f5c518] mx-6 mt-6 px-5 py-4">
        <p className="font-sans font-black text-[#0a0f1e] text-base uppercase tracking-wide">{title}</p>
        <p className="font-sans text-xs text-[#888] mt-1">
          {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Visible text */}
      <pre className="relative z-10 whitespace-pre-wrap text-xs leading-relaxed px-7 py-5 font-serif text-[#1a1a2e]">
        {visible}
      </pre>

      {/* Blurred section */}
      <div className="relative">
        <pre className="whitespace-pre-wrap text-xs leading-relaxed px-7 py-2 font-serif text-[#1a1a2e]"
          style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none" }}>
          {blurred || "Clause 4. MAINTENANCE AND UTILITIES\n4.1 The Tenant shall bear the cost of all utilities...\nClause 5. TERMINATION\n5.1 Either party may terminate this Agreement...\nClause 6. DISPUTE RESOLUTION\n6.1 Any disputes shall be settled by arbitration..."}
        </pre>
        {/* Gradient fade into lock */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/70 to-white" />
      </div>

      {/* Lock bar */}
      <div className="relative z-20 flex flex-col items-center justify-center pb-7 pt-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-[#0a0f1e] rounded-full border border-[#f5c518]/30">
          <Lock className="h-3.5 w-3.5 text-[#f5c518]" />
          <span className="text-[#f5c518] text-xs font-bold">Full document unlocks after payment</span>
        </div>
        <p className="text-[#888] text-[11px] mt-2 font-sans">
          ~{Math.ceil(content.split(" ").length / 250)} pages · professionally formatted
        </p>
      </div>
    </div>
  );
}

// ── Order Summary Sidebar ─────────────────────────────────────────────────────
function OrderSidebar({
  title, price, isLoggedIn, onLogin, onPay, isPaying,
}: {
  title: string; price: number; isLoggedIn: boolean;
  onLogin: () => void; onPay: () => void; isPaying: boolean;
}) {
  const gst = Math.round(price * 0.18);
  const total = price + gst;

  return (
    <div className="bg-card border border-white/10 rounded-2xl p-6 shadow-2xl sticky top-24">
      {/* Document badge */}
      <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/10">
        <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{title}</p>
          <p className="text-muted-foreground text-xs">AI-generated · Lawyer-reviewed</p>
        </div>
      </div>

      {/* AI generation complete indicator */}
      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5 mb-5">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-green-400 text-xs font-medium">NVIDIA AI generation complete</span>
      </div>

      {/* Price breakdown */}
      <div className="space-y-2.5 mb-5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Document price</span>
          <span className="text-white">₹{price}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">GST (18%)</span>
          <span className="text-white">₹{gst}</span>
        </div>
        <div className="flex justify-between font-bold pt-2.5 border-t border-white/10">
          <span className="text-white">Total</span>
          <span className="text-primary text-lg">₹{total}</span>
        </div>
      </div>

      {/* Feature checklist */}
      <ul className="space-y-2 mb-6 text-sm">
        {[
          "Professional print-ready PDF",
          "No watermark after download",
          "Re-download anytime from Dashboard",
          "Email delivery included",
          "7-day refund guarantee",
        ].map((f) => (
          <li key={f} className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isLoggedIn ? (
        <Button
          onClick={onPay}
          disabled={isPaying}
          className="w-full h-14 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold"
        >
          {isPaying ? (
            <><Loader2 className="animate-spin mr-2 h-5 w-5" />Processing…</>
          ) : (
            <><Lock className="mr-2 h-5 w-5" />Unlock PDF — ₹{total}</>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="text-center mb-1">
            <p className="text-white font-bold text-sm">🎉 Your document is ready!</p>
            <p className="text-muted-foreground text-xs mt-1">Sign in to unlock the full PDF</p>
          </div>
          <Button
            onClick={onLogin}
            className="w-full h-12 font-bold bg-white text-[#0a0f1e] hover:bg-white/90 flex items-center justify-center gap-2.5"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google — Free
          </Button>
          <p className="text-center text-xs text-muted-foreground/60">
            No spam · Secure · DPDPA 2023 Compliant
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground/60">
        <Shield className="h-3.5 w-3.5" />
        Secured by Razorpay · UPI, Cards, NetBanking, Wallets
      </div>
    </div>
  );
}

// ── Guest Success Page (no DB, PDF already downloaded) ───────────────────────
function GuestSuccessView({
  title, blobUrl, onAnother, onLogin,
}: {
  title: string; blobUrl: string | null;
  onAnother: () => void; onLogin: () => void;
}) {
  const { toast } = useToast();

  function reDownload() {
    if (!blobUrl) { toast({ title: "File expired", description: "Please generate a new document.", variant: "destructive" }); return; }
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${title.replace(/\s+/g, "-")}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-4">
        {/* Success card */}
        <div className="bg-card border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-green-500/30">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-2xl font-black text-white mb-1">Payment Successful! 🎉</h1>
            <p className="text-muted-foreground mb-6">Your PDF was downloaded automatically.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-background border border-white/5 rounded-xl p-4 flex items-center gap-3 mb-6 text-left">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{title}.pdf</p>
              <p className="text-xs text-muted-foreground">A4 · Print-ready · Professional format</p>
            </div>
            <Check className="h-5 w-5 text-green-400 shrink-0" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="space-y-3">
            {blobUrl && (
              <Button onClick={reDownload}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-gold">
                <Download className="mr-2 h-4 w-4" />Download Again
              </Button>
            )}
            <Button onClick={onAnother} variant="ghost"
              className="w-full h-10 text-muted-foreground text-sm hover:text-white">
              <Sparkles className="mr-2 h-4 w-4" /> Generate Another Document
            </Button>
          </motion.div>
        </div>

        {/* Soft login offer */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-primary/10 to-yellow-500/5 border border-primary/25 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 bg-primary/20 rounded-xl shrink-0 border border-primary/30">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-white font-bold mb-1">Save to dashboard?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Create a free account to re-download anytime, track all your documents, and get exclusive deals.
              </p>
            </div>
          </div>
          <Button onClick={onLogin}
            className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm">
            Sign Up Free — It's Quick
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Success Page ──────────────────────────────────────────────────────────────
function SuccessView({
  docId, title, onDashboard, onAnother,
}: {
  docId: number; title: string; onDashboard: () => void; onAnother: () => void;
}) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [autoDownloaded, setAutoDownloaded] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await authFetch(`${BASE}/api/documents/${docId}/download`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${title.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      setAutoDownloaded(true);
      toast({ title: "Download started! 🎉", description: "Your legal PDF is downloading." });
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    } finally { setDownloading(false); }
  }, [docId, title]);

  // Auto-trigger download
  useEffect(() => { handleDownload(); }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />

        {/* Confetti-style animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-green-500/30">
          <CheckCircle2 className="h-12 w-12 text-green-400" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="text-2xl font-black text-white mb-1">Payment Successful!</h1>
          <p className="text-muted-foreground mb-6">Your document is unlocked and ready to download.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-background border border-white/5 rounded-xl p-4 flex items-center gap-3 mb-6 text-left">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{title}.pdf</p>
            <p className="text-xs text-muted-foreground">A4 · Print-ready · Professional format</p>
          </div>
          {autoDownloaded && <Check className="h-5 w-5 text-green-400 shrink-0" />}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="space-y-3">
          <Button onClick={handleDownload} disabled={downloading}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-gold">
            {downloading
              ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Preparing…</>
              : <><Download className="mr-2 h-4 w-4" />Download PDF Again</>}
          </Button>
          <Button onClick={onDashboard} variant="outline"
            className="w-full h-12 border-white/10 text-muted-foreground hover:text-white">
            View in Dashboard
          </Button>
          <Button onClick={onAnother} variant="ghost"
            className="w-full h-10 text-muted-foreground text-sm hover:text-white">
            <Sparkles className="mr-2 h-4 w-4" /> Generate Another Document
          </Button>
        </motion.div>

        <p className="text-xs text-muted-foreground/50 mt-5">
          A copy has been sent to your email · Re-download anytime from Dashboard
        </p>
      </div>
    </motion.div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function GenerateDocument() {
  const { type } = useParams<{ type: string }>();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { t, language: appLang } = useLanguage();
  const { toast } = useToast();
  const { token, user } = useAuthStore();
  const isLoggedIn = !!token;

  const docConfig = DOCUMENTS[type as keyof typeof DOCUMENTS];
  const fields: string[] = docConfig?.fields ?? [];

  // ── Phase & state ─────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("wizard");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    try { const s = localStorage.getItem(`kanoox_wizard_${type}`); return s ? JSON.parse(s) : {}; }
    catch { return {}; }
  });
  const [docLanguage, setDocLanguage] = useState("en");
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [showLangPicker, setShowLangPicker] = useState(false);

  // Streaming
  const [streamText, setStreamText] = useState("");
  const [stageIdx, setStageIdx] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const streamRef = useRef<HTMLPreElement>(null);

  // Locked phase
  const [generatedDoc, setGeneratedDoc] = useState<PendingDoc | null>(null);
  const [savedDocId, setSavedDocId] = useState<number | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [guestPdfBlobUrl, setGuestPdfBlobUrl] = useState<string | null>(null);

  // ── Auto-save wizard ───────────────────────────────────────────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(`kanoox_wizard_${type}`, JSON.stringify(formData)); } catch {}
    }, 600);
  }, [formData, type]);

  // ── Stream stage ticker ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "streaming") return;
    const id = setInterval(() => setStageIdx((i) => Math.min(i + 1, STREAM_STAGES.length - 1)), 3800);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
    setWordCount(streamText.split(/\s+/).filter(Boolean).length);
  }, [streamText]);

  // ── Handle ?resume=1 after login ───────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    const params = new URLSearchParams(search);
    if (params.get("resume") !== "1") return;

    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try {
      const pending: PendingDoc = JSON.parse(raw);
      if (pending.type !== type) return;
      setGeneratedDoc(pending);
      setStreamText(pending.content);
      setPhase("saving");
      saveToDatabase(pending);
    } catch {}
  }, [isLoggedIn, search, type]);

  // ── SEO ───────────────────────────────────────────────────────────────────
  useSeo({
    title: docConfig
      ? `Generate ${docConfig.name} — Kanoox AI | AI Legal Document India`
      : "Generate Legal Document — Kanoox AI",
    description: docConfig
      ? `Create a ${docConfig.name} in 60 seconds. Free to preview. Pay ₹${docConfig.price} to unlock PDF.`
      : undefined,
  });

  if (!docConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center">
          <p className="text-white mb-4">Document type not found.</p>
          <Button onClick={() => setLocation("/documents")} variant="outline">Browse Templates</Button>
        </div>
      </div>
    );
  }

  // ── Save to DB after login (for the ?resume=1 flow) ──────────────────────────
  async function saveToDatabase(pending: PendingDoc) {
    try {
      const res = await authFetch(`${BASE}/api/documents/from-content`, {
        method: "POST",
        body: JSON.stringify({
          type: pending.type,
          title: pending.title,
          content: pending.content,
          formData: pending.formData,
          language: pending.language,
          price: pending.price,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      setSavedDocId(data.id);
      localStorage.removeItem(PENDING_KEY);
      setPhase("payment");
      setTimeout(() => openRazorpay(data.id, pending.price, pending.title), 400);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
      setPhase("locked");
    }
  }

  // ── Razorpay payment (guest — no DB, PDF returned directly) ─────────────────
  async function openGuestRazorpay(pending: PendingDoc) {
    setIsPaying(true);
    try {
      await loadRazorpay();
      const orderRes = await authFetch(`${BASE}/api/payments/guest-create-order`, {
        method: "POST",
        body: JSON.stringify({ type: pending.type }),
      });
      if (!orderRes.ok) throw new Error("Could not create payment order");
      const order = await orderRes.json();

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: "INR",
        name: "Kanoox AI",
        description: pending.title,
        order_id: order.orderId,
        prefill: {},
        theme: { color: "#F5C518" },
        handler: async (response: any) => {
          try {
            const deliverRes = await authFetch(`${BASE}/api/payments/guest-deliver`, {
              method: "POST",
              body: JSON.stringify({
                orderId:   response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                content:   pending.content,
                title:     pending.title,
              }),
            });
            if (!deliverRes.ok) {
              const e = await deliverRes.json().catch(() => ({}));
              throw new Error((e as any).error || "PDF delivery failed");
            }
            const blob   = await deliverRes.blob();
            const blobUrl = URL.createObjectURL(blob);
            // Auto-download
            const a = document.createElement("a");
            a.href     = blobUrl;
            a.download = `${pending.title.replace(/\s+/g, "-")}.pdf`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            // Show guest success
            setGuestPdfBlobUrl(blobUrl);
            setPhase("success");
            try { localStorage.removeItem(PENDING_KEY); } catch {}
            try { localStorage.removeItem(`kanoox_wizard_${type}`); } catch {}
          } catch (err: any) {
            toast({ title: "Delivery failed", description: err.message ?? "Please contact support.", variant: "destructive" });
            setIsPaying(false);
          }
        },
        modal: { ondismiss: () => setIsPaying(false) },
      });
      rzp.on("payment.failed", () => {
        toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
        setIsPaying(false);
      });
      rzp.open();
    } catch (err: any) {
      toast({ title: "Payment error", description: err.message, variant: "destructive" });
      setIsPaying(false);
    }
  }

  // ── Razorpay payment (auth — saves doc in DB, download from dashboard) ───────
  async function openRazorpay(docId: number, price: number, title: string) {
    setIsPaying(true);
    try {
      await loadRazorpay();
      const orderRes = await authFetch(`${BASE}/api/payments/create-order`, {
        method: "POST",
        body: JSON.stringify({ documentId: docId, amount: price }),
      });
      if (!orderRes.ok) throw new Error("Could not create payment order");
      const order = await orderRes.json();
      const gst = Math.round(price * 0.18);
      const total = price + gst;

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: total * 100,
        currency: "INR",
        name: "Kanoox AI",
        description: title,
        order_id: order.orderId,
        prefill: { name: user?.name ?? "", email: user?.email ?? "" },
        theme: { color: "#F5C518" },
        handler: async (response: any) => {
          try {
            await authFetch(`${BASE}/api/payments/verify`, {
              method: "POST",
              body: JSON.stringify({
                documentId: docId,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });
            setSavedDocId(docId);
            setPhase("success");
            try { localStorage.removeItem(`kanoox_wizard_${type}`); } catch {}
          } catch {
            toast({ title: "Verification failed", description: "Payment received. Contact support.", variant: "destructive" });
          }
        },
        modal: { ondismiss: () => setIsPaying(false) },
      });
      rzp.on("payment.failed", () => {
        toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
        setIsPaying(false);
      });
      rzp.open();
    } catch (err: any) {
      toast({ title: "Payment error", description: err.message, variant: "destructive" });
      setIsPaying(false);
    }
  }

  // ── Submit wizard — start generation ──────────────────────────────────────
  async function handleGenerate() {
    abortRef.current = new AbortController();
    setPhase("streaming");
    setStreamText("");
    setStageIdx(0);

    // Choose endpoint based on auth status
    const endpoint = isLoggedIn
      ? `${BASE}/api/documents/stream`
      : `${BASE}/api/documents/stream/guest`;

    try {
      const res = await authFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ type, formData, language: docLanguage }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || `Error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.chunk) {
              fullContent += payload.chunk;
              setStreamText((p) => p + payload.chunk);
            } else if (payload.done) {
              if (isLoggedIn && payload.docId) {
                // Authenticated stream → already saved
                setSavedDocId(payload.docId);
                setPhase("payment");
                setTimeout(() => openRazorpay(payload.docId, docConfig.price, docConfig.name), 400);
              } else {
                // Guest stream → show locked preview (pay without login)
                const pending: PendingDoc = {
                  type: type!, formData,
                  content: fullContent,
                  language: docLanguage,
                  title: payload.title ?? docConfig.name,
                  price: payload.price ?? docConfig.price,
                };
                setGeneratedDoc(pending);
                try { localStorage.setItem(PENDING_KEY, JSON.stringify(pending)); } catch {}
                setPhase("locked");
              }
              return;
            } else if (payload.error) throw new Error(payload.error);
          } catch {}
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setPhase("wizard");
      toast({ title: "Generation failed", description: err?.message, variant: "destructive" });
    }
  }

  function handleLoginForUnlock() {
    try {
      sessionStorage.setItem(REDIRECT_KEY, `/documents/generate/${type}?resume=1`);
    } catch {}
    setLocation("/login");
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (phase === "success") {
    if (savedDocId) {
      return (
        <SuccessView
          docId={savedDocId}
          title={generatedDoc?.title ?? docConfig.name}
          onDashboard={() => setLocation("/dashboard")}
          onAnother={() => setLocation("/documents")}
        />
      );
    }
    // Guest success — PDF already auto-downloaded by openGuestRazorpay
    return (
      <GuestSuccessView
        title={generatedDoc?.title ?? docConfig.name}
        blobUrl={guestPdfBlobUrl}
        onAnother={() => setLocation("/documents")}
        onLogin={() => {
          try { sessionStorage.setItem(REDIRECT_KEY, `/documents/generate/${type}?resume=1`); } catch {}
          setLocation("/login");
        }}
      />
    );
  }

  // ── PAYMENT WAITING (opening Razorpay) ────────────────────────────────────
  if (phase === "payment" || phase === "saving") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full" />
        <p className="text-white font-medium">
          {phase === "saving" ? "Saving your document…" : "Opening payment…"}
        </p>
        <p className="text-muted-foreground text-sm">Powered by Razorpay · SSL Secured</p>
      </div>
    );
  }

  // ── LOCKED PREVIEW ────────────────────────────────────────────────────────
  if (phase === "locked" && generatedDoc) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top bar */}
        <div className="border-b border-white/10 bg-card/80 backdrop-blur px-5 py-3 flex items-center gap-4 sticky top-0 z-20">
          <Button variant="ghost" size="icon" onClick={() => setPhase("wizard")}
            className="text-muted-foreground hover:text-white h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{generatedDoc.title}</p>
            <p className="text-xs text-muted-foreground">AI generation complete · Preview ready</p>
          </div>
          {/* Progress pills */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {["Details", "Generate", "Payment", "Download"]
              .map((s, i) => (
                <div key={s} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
                  i < 2 ? "bg-primary/10 border-primary/30 text-primary"
                  : i === 2 ? "bg-white/10 border-white/20 text-white"
                  : "border-white/10 text-muted-foreground/50"
                }`}>
                  {i < 2 && <Check className="h-2.5 w-2.5" />}{s}
                </div>
              ))}
          </div>
        </div>

        <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl flex flex-col lg:flex-row gap-8">
          {/* Left: Locked doc preview */}
          <div className="flex-1 min-w-0">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <LockedDocPreview content={generatedDoc.content} title={generatedDoc.title} />
            </motion.div>
          </div>

          {/* Right: Order sidebar */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0">
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <OrderSidebar
                title={generatedDoc.title}
                price={generatedDoc.price}
                isLoggedIn={true}
                onLogin={handleLoginForUnlock}
                onPay={() => {
                  if (savedDocId) openRazorpay(savedDocId, generatedDoc.price, generatedDoc.title);
                  else if (isLoggedIn) { setPhase("saving"); saveToDatabase(generatedDoc); }
                  else openGuestRazorpay(generatedDoc);
                }}
                isPaying={isPaying}
              />
            </motion.div>
          </div>
        </div>

        {/* Mobile sticky CTA */}
        <div className="lg:hidden sticky bottom-0 bg-card/95 backdrop-blur border-t border-white/10 p-4">
          <Button onClick={() => {
            if (savedDocId) openRazorpay(savedDocId, generatedDoc.price, generatedDoc.title);
            else if (isLoggedIn) { setPhase("saving"); saveToDatabase(generatedDoc); }
            else openGuestRazorpay(generatedDoc);
          }} disabled={isPaying}
            className="w-full h-14 text-base font-bold bg-primary text-primary-foreground shadow-gold">
            {isPaying ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Lock className="mr-2 h-5 w-5" />}
            Unlock PDF — ₹{generatedDoc.price + Math.round(generatedDoc.price * 0.18)}
          </Button>
        </div>
      </div>
    );
  }

  // ── STREAMING VIEW ────────────────────────────────────────────────────────
  if (phase === "streaming") {
    const prog = Math.min(10 + (streamText.length / 8000) * 85, 95);
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-white/10 bg-card/80 backdrop-blur px-5 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-[#76b900]/10 rounded-lg flex items-center justify-center border border-[#76b900]/30">
              <Zap className="h-4 w-4 text-[#76b900]" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{docConfig.name}</p>
              <p className="text-[#76b900] text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#76b900] rounded-full animate-pulse inline-block" />
                Llama 3.3 70B generating…
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{wordCount.toLocaleString()} words</span>
            <button onClick={() => { abortRef.current?.abort(); setPhase("wizard"); }}
              className="text-red-400 hover:text-red-300">Cancel</button>
          </div>
        </div>

        <div className="h-0.5 bg-white/5">
          <motion.div className="h-full bg-[#76b900]" animate={{ width: `${prog}%` }} transition={{ duration: 0.5 }} />
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-52 shrink-0 border-r border-white/10 bg-card/50 p-5 hidden md:flex flex-col gap-4">
            <div className="bg-[#76b900]/5 border border-[#76b900]/20 rounded-xl p-4">
              <p className="text-[#76b900] text-xs font-bold uppercase tracking-wider mb-3">AI Status</p>
              <div className="space-y-2">
                {STREAM_STAGES.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      i < stageIdx ? "bg-[#76b900]"
                      : i === stageIdx ? "bg-[#76b900] animate-pulse"
                      : "bg-white/20"
                    }`} />
                    <span className={`text-xs ${i <= stageIdx ? "text-white" : "text-muted-foreground"}`}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden relative">
              {streamText ? (
                <pre ref={streamRef}
                  className="h-full overflow-auto p-6 text-sm text-white/90 leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: "'Courier New', monospace" }}>
                  {streamText}
                  <span className="inline-block w-2 h-4 bg-[#76b900] ml-0.5 animate-pulse align-middle" />
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <motion.div animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-14 h-14 border-4 border-[#76b900]/20 border-t-[#76b900] rounded-full mx-auto mb-4" />
                    <p className="text-white font-medium">{STREAM_STAGES[stageIdx]}</p>
                    <p className="text-muted-foreground text-sm mt-1">Powered by Llama 3.3 70B via NVIDIA</p>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-white/10 bg-card/50 px-5 py-2 flex items-center justify-between text-xs text-muted-foreground">
              <AnimatePresence mode="wait">
                <motion.span key={stageIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2 text-[#76b900]">
                  <Sparkles className="h-3 w-3" />{STREAM_STAGES[stageIdx]}
                </motion.span>
              </AnimatePresence>
              <span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-[#76b900]" />NVIDIA AI</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── WIZARD VIEW ───────────────────────────────────────────────────────────
  const currentFieldKey = fields[step] ?? "";
  const currentConfig = getFieldConfig(currentFieldKey);
  const currentValue = formData[currentFieldKey] ?? "";
  const completedCount = fields.filter((f) => !!formData[f]).length;
  const progress = fields.length > 0 ? (completedCount / fields.length) * 100 : 0;
  const isLastStep = step === fields.length - 1;
  const previewHtml = buildDocumentPreview(type!, formData, docConfig.name);

  const stepVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 40 : -40, opacity: 0 }),
  };

  const goTo = (n: number) => {
    setDirection(n > step ? 1 : -1);
    setStep(Math.max(0, Math.min(n, fields.length - 1)));
  };

  const question = appLang === "hi"
    ? (currentConfig.questionHi ?? currentConfig.question)
    : currentConfig.question;
  const aiTip = appLang === "hi"
    ? (currentConfig.aiTipHi ?? currentConfig.aiTip)
    : currentConfig.aiTip;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-card/80 backdrop-blur px-5 py-3 flex items-center gap-4 sticky top-0 z-20">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/documents")}
          className="text-muted-foreground hover:text-white h-8 w-8 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white text-sm font-semibold truncate">{docConfig.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:block">
                {completedCount}/{fields.length} · ₹{docConfig.price}
              </span>
              <button onClick={() => setShowLangPicker((p) => !p)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground hover:text-white transition-colors">
                <Globe className="h-3 w-3" />
                {LANGS.find((l) => l.code === docLanguage)?.label}
              </button>
            </div>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full"
              animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
          </div>
        </div>
      </div>

      {/* Lang picker */}
      <AnimatePresence>
        {showLangPicker && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute top-16 right-4 z-40 bg-card border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-1.5">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => { setDocLanguage(l.code); setShowLangPicker(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  docLanguage === l.code ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}>
                {l.flag} {l.label} {docLanguage === l.code && <Check className="h-3 w-3 ml-auto" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile tabs */}
      <div className="flex lg:hidden sticky top-[57px] z-30 bg-background/95 backdrop-blur border-b border-white/10">
        {(["form", "preview"] as const).map((tab) => (
          <button key={tab} onClick={() => setMobileTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              mobileTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}>
            {tab === "form" ? <FileText className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {tab === "form" ? "Form" : "Live Preview"}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Wizard */}
        <div className={`w-full lg:w-[52%] flex flex-col overflow-y-auto ${mobileTab === "preview" ? "hidden lg:flex" : "flex"}`}>
          <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col">
            {/* Completed pills */}
            {completedCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {fields.slice(0, step).map((fk) =>
                  formData[fk] ? (
                    <button key={fk} onClick={() => goTo(fields.indexOf(fk))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary hover:bg-primary/20 transition-colors">
                      <Check className="h-3 w-3" />
                      <span className="text-muted-foreground">{FIELD_LABELS[fk]?.en ?? fk}:</span>
                      <span className="font-medium truncate max-w-[80px]">
                        {formData[fk].length > 18 ? formData[fk].slice(0, 16) + "…" : formData[fk]}
                      </span>
                    </button>
                  ) : null
                )}
              </div>
            )}

            {/* Active step */}
            <div className="flex-1 flex flex-col justify-center max-w-lg">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div key={step} custom={direction} variants={stepVariants}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{currentConfig.emoji ?? "✏️"}</span>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Step {step + 1} of {fields.length}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug">{question}</h2>
                  <FieldInput
                    fieldKey={currentFieldKey} config={currentConfig}
                    value={currentValue}
                    onChange={(v) => setFormData((p) => ({ ...p, [currentFieldKey]: v }))}
                    onEnter={() => isLastStep ? handleGenerate() : goTo(step + 1)}
                  />
                  {aiTip && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      className="flex items-start gap-2.5 px-4 py-3 bg-primary/5 border border-primary/15 rounded-xl">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{aiTip}</p>
                    </motion.div>
                  )}
                  {currentConfig.type !== "textarea" && currentConfig.type !== "select" && (
                    <p className="text-xs text-muted-foreground/50">
                      Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Enter ↵</kbd> to continue
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Nav */}
            <div className="pt-8 flex items-center justify-between gap-4">
              <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0}
                className="text-muted-foreground hover:text-white gap-2">
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
              <div className="flex items-center gap-3">
                {!isLastStep && currentValue === "" && (
                  <button onClick={() => goTo(step + 1)}
                    className="text-xs text-muted-foreground/50 hover:text-muted-foreground underline-offset-2 hover:underline">
                    Skip
                  </button>
                )}
                <Button onClick={() => isLastStep ? handleGenerate() : goTo(step + 1)}
                  className="h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold font-bold group gap-2">
                  {isLastStep
                    ? <><Sparkles className="h-4 w-4" />Generate with AI</>
                    : <>Next<ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></>
                  }
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground/50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" />SSL</span>
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" />NVIDIA AI</span>
                <span>Free preview · ₹{docConfig.price} to download</span>
              </div>
              <button onClick={() => {
                if (confirm("Clear all answers and start over?")) {
                  setFormData({}); setStep(0);
                  try { localStorage.removeItem(`kanoox_wizard_${type}`); } catch {}
                }
              }} className="flex items-center gap-1 hover:text-muted-foreground transition-colors">
                <RotateCcw className="h-3 w-3" />Reset
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Live preview */}
        <div className={`hidden lg:flex flex-col w-[48%] border-l border-white/10 bg-black/20 overflow-hidden ${mobileTab === "preview" ? "!flex w-full" : ""}`}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-card/50 shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-white">Live Preview</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">UPDATES LIVE</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {completedCount} / {fields.length} filled
            </div>
          </div>
          <div className="flex-1 overflow-hidden bg-[#1a1a1a] p-4">
            <div className="h-full rounded-xl overflow-hidden shadow-2xl border border-white/5">
              <iframe srcDoc={previewHtml} className="w-full h-full" title="Live document preview"
                sandbox="allow-same-origin" scrolling="yes" />
            </div>
          </div>
          <div className="px-5 py-3 border-t border-white/10 bg-card/50 shrink-0 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">Free</span> to draft & preview ·
              Pay <span className="text-primary font-medium">₹{docConfig.price}</span> to unlock PDF
            </p>
            <Button size="sm" onClick={handleGenerate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs gap-1 shadow-gold">
              <Sparkles className="h-3 w-3" />Generate Now
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile preview */}
      {mobileTab === "preview" && (
        <div className="flex lg:hidden flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden bg-[#1a1a1a] p-3">
            <div className="h-full rounded-xl overflow-hidden shadow-2xl border border-white/5">
              <iframe srcDoc={previewHtml} className="w-full h-full" title="Preview"
                sandbox="allow-same-origin" scrolling="yes" />
            </div>
          </div>
          <div className="px-4 py-3 border-t border-white/10 bg-card/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Free preview · ₹{docConfig.price} to download</p>
            <Button size="sm" onClick={() => setMobileTab("form")}
              className="bg-primary text-primary-foreground h-8 text-xs">Continue Form →</Button>
          </div>
        </div>
      )}
    </div>
  );
}
