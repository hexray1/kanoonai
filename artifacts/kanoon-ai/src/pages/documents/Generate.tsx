/**
 * Generate.tsx — Full conversion-optimised flow:
 * Wizard → Guest AI Stream → Locked Preview → Payment → Download
 * No account or login is required at any point.
 */
import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Zap, Shield, Globe,
  Sparkles, ChevronRight, Eye, FileText, RotateCcw,
  Lock, FileDown, CheckCircle2, Loader2, Star,
  Download, PartyPopper, Cpu, FileCheck2, PenLine,
  ScanSearch, ShieldCheck, Layers3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCUMENTS, FIELD_LABELS } from "@/lib/constants";
import { getFieldConfig, INDIAN_STATES, type FieldConfig } from "@/lib/fieldConfig";
import { buildDocumentPreview } from "@/lib/documentTemplates";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { guestFetch } from "@/hooks/use-guest-fetch";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Types ────────────────────────────────────────────────────────────────────
type Phase = "wizard" | "streaming" | "locked" | "payment" | "success";

interface PendingDoc {
  type: string;
  documentId: string | null; // server-stored document id (payment binds to this)
  formData: Record<string, string>;
  content: string;
  language: string;
  title: string;
  price: number;
}

interface PaidAccess {
  documentId: string;
  downloadToken: string;
  editToken: string | null;
  editExpiresAt: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const PENDING_KEY = "kanoon_pending_doc";

const STREAM_STAGES = [
  "Connecting to AI engine…",
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
          <span className="text-[#f5c518] font-bold text-sm">Kanoon AI</span>
        </div>
        <span className="text-[#888] text-xs">DRAFT PREVIEW</span>
      </div>
      <div className="h-[3px] bg-[#f5c518]" />

      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <span style={{ transform: "rotate(-35deg)", fontSize: "72px", fontWeight: 900,
          color: "rgba(0,0,0,0.04)", whiteSpace: "nowrap", fontFamily: "sans-serif",
          letterSpacing: "6px" }}>
          KANOON AI PREVIEW
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
  title, price, onPay, isPaying,
}: {
  title: string; price: number; onPay: () => void; isPaying: boolean;
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
          <p className="text-muted-foreground text-xs">AI-generated draft</p>
        </div>
      </div>

      {/* AI generation complete indicator */}
      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5 mb-5">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-green-400 text-xs font-medium">AI generation complete</span>
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
          "Instant PDF download after payment",
          "Secure download link included",
          "Free edits for 7 days",
        ].map((f) => (
          <li key={f} className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {
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
        </Button>}

      <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground/60">
        <Shield className="h-3.5 w-3.5" />
        Secured by Razorpay · UPI, Cards, NetBanking, Wallets
      </div>
    </div>
  );
}

// ── Premium document generation experience ───────────────────────────────────
function DocumentGenerationExperience({
  documentName, streamText, stageIdx, progress, wordCount, onCancel,
}: {
  documentName: string;
  streamText: string;
  stageIdx: number;
  progress: number;
  wordCount: number;
  onCancel: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const currentStage = Math.min(stageIdx, STREAM_STAGES.length - 1);
  const stageDetails = [
    { icon: Cpu, eyebrow: "Secure AI workspace", detail: "Establishing a private drafting session" },
    { icon: ScanSearch, eyebrow: "Legal intelligence", detail: "Matching Indian legal requirements" },
    { icon: PenLine, eyebrow: "First draft", detail: "Structuring parties, recitals and intent" },
    { icon: Layers3, eyebrow: "Clause engine", detail: "Building clear, enforceable provisions" },
    { icon: ShieldCheck, eyebrow: "Quality review", detail: "Checking jurisdiction and consistency" },
    { icon: FileCheck2, eyebrow: "Finishing touches", detail: "Preparing your print-ready document" },
  ];
  const ActiveIcon = stageDetails[currentStage].icon;
  const visibleText = streamText.slice(0, 3400);

  return (
    <div className="generation-shell min-h-screen bg-background text-white flex flex-col overflow-hidden">
      <div className="generation-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="generation-glow generation-glow-gold pointer-events-none absolute -top-48 left-1/2 h-[540px] w-[540px] -translate-x-1/2 rounded-full" />
      <div className="generation-glow generation-glow-green pointer-events-none absolute -bottom-72 -right-40 h-[480px] w-[480px] rounded-full" />

      <header className="relative z-10 border-b border-white/[0.08] bg-[#090d17]/75 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="generation-brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{documentName}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-primary/80">
                <span className="generation-live-dot h-1.5 w-1.5 rounded-full bg-primary" />
                Creating your document
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-8 lg:py-12">
        <div className="mb-8 text-center">
          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-primary"
          >
            Kanoon AI · Professional drafting studio
          </motion.p>
          <motion.h1
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : 0.08 }}
            className="text-2xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            Your document is being crafted.
          </motion.h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Our legal AI is turning your details into a clear, professional document — reviewed for Indian legal context.
          </p>
        </div>

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[220px_minmax(360px,1fr)_250px] lg:gap-12">
          <aside className="order-2 hidden lg:block">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-px w-6 bg-primary/60" /> Drafting flow
            </div>
            <div className="space-y-1">
              {STREAM_STAGES.map((stage, index) => {
                const completed = index < currentStage;
                const active = index === currentStage;
                return (
                  <div
                    key={stage}
                    className={`relative flex gap-3 rounded-xl px-3 py-3 transition-colors ${
                      active ? "bg-primary/[0.08] text-white" : completed ? "text-white/65" : "text-muted-foreground/45"
                    }`}
                  >
                    {active && <motion.div layoutId="active-stage" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />}
                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                      completed ? "border-green-400/50 bg-green-400/10 text-green-400" :
                      active ? "border-primary/60 bg-primary/15 text-primary" : "border-white/10 text-muted-foreground/40"
                    }`}>
                      {completed ? <Check className="h-3 w-3" /> : index + 1}
                    </div>
                    <span className="text-[11px] leading-4">{stage.replace("…", "")}</span>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="order-1 flex justify-center">
            <div className="relative w-full max-w-[430px]">
              <motion.div
                aria-hidden="true"
                animate={reducedMotion ? undefined : { rotate: 360 }}
                transition={reducedMotion ? undefined : { duration: 24, repeat: Infinity, ease: "linear" }}
                className="generation-orbit absolute -inset-5 rounded-[2.25rem] border border-primary/15"
              />
              <motion.div
                aria-hidden="true"
                animate={reducedMotion ? undefined : { rotate: -360 }}
                transition={reducedMotion ? undefined : { duration: 18, repeat: Infinity, ease: "linear" }}
                className="generation-orbit generation-orbit-secondary absolute -inset-2 rounded-[1.75rem] border border-green-400/10"
              />

              <div className="relative rounded-[1.6rem] border border-white/15 bg-[#111827]/90 p-2 shadow-[0_30px_100px_-30px_rgba(234,179,8,0.35)] backdrop-blur-xl">
                <div className="relative aspect-[0.73] overflow-hidden rounded-[1.25rem] bg-[#f7f4ed] text-[#19202a] shadow-inner">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#d6a512] to-transparent" />
                  <div className="flex items-center justify-between px-7 pt-7">
                    <div>
                      <div className="mb-2 h-1 w-16 rounded-full bg-[#c69928]" />
                      <p className="font-serif text-[10px] font-bold uppercase tracking-[0.2em] text-[#555b63]">Legal document</p>
                    </div>
                    <div className="h-8 w-8 rounded-full border border-[#d8c58b] bg-[#f2e8c6]/60" />
                  </div>

                  <div className="relative h-[calc(100%-76px)] overflow-hidden px-7 pb-7 pt-6">
                    {visibleText ? (
                      <pre className="generation-document-text h-full overflow-hidden whitespace-pre-wrap font-serif text-[10px] leading-[1.9] text-[#343b45]">
                        {visibleText}
                        <span className="generation-caret ml-0.5 inline-block h-3 w-0.5 bg-[#bd8b11] align-middle" />
                      </pre>
                    ) : (
                      <div className="space-y-4">
                        {[88, 68, 94, 80, 90, 61, 82, 73, 91].map((width, index) => (
                          <motion.div
                            key={index}
                            animate={reducedMotion ? undefined : { opacity: [0.25, 0.75, 0.25] }}
                            transition={reducedMotion ? undefined : { duration: 1.8, delay: index * 0.08, repeat: Infinity }}
                            className="h-2 rounded-full bg-[#c7c1b2]"
                            style={{ width: `${width}%` }}
                          />
                        ))}
                      </div>
                    )}
                    <motion.div
                      aria-hidden="true"
                      animate={reducedMotion ? undefined : { top: ["-10%", "110%"] }}
                      transition={reducedMotion ? undefined : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                      className="generation-scan-line pointer-events-none absolute inset-x-5 h-20"
                    />
                  </div>
                  <div className="absolute bottom-4 right-6 font-mono text-[8px] tracking-widest text-[#a59b83]">KX / DRAFT</div>
                </div>
              </div>

              <motion.div
                key={currentStage}
                initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute -bottom-5 left-1/2 flex max-w-[calc(100vw-2.5rem)] -translate-x-1/2 items-center justify-center gap-2 rounded-full border border-white/15 bg-[#101827]/95 px-4 py-2.5 text-xs font-medium text-white shadow-xl backdrop-blur-xl text-center"
              >
                <ActiveIcon className="h-3.5 w-3.5 text-primary" />
                {stageDetails[currentStage].eyebrow}
                <span className="h-1 w-1 rounded-full bg-green-400" />
                <span className="text-muted-foreground">{wordCount.toLocaleString()} words</span>
              </motion.div>
            </div>
          </section>

          <aside className="order-3 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Live status</p>
                  <p className="mt-1 text-sm font-semibold text-white">{stageDetails[currentStage].detail}</p>
                </div>
                <motion.div
                  animate={reducedMotion ? undefined : { scale: [1, 1.12, 1] }}
                  transition={reducedMotion ? undefined : { duration: 2, repeat: Infinity }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10"
                >
                  <ActiveIcon className="h-4 w-4 text-primary" />
                </motion.div>
              </div>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-3xl font-semibold tracking-tight text-white">{Math.round(progress)}<span className="text-base text-primary">%</span></span>
                <span className="text-xs text-muted-foreground">{wordCount.toLocaleString()} words</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="generation-progress-fill h-full rounded-full bg-gradient-to-r from-primary via-yellow-300 to-green-400"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-green-300/80">
                <ShieldCheck className="h-3.5 w-3.5" /> Private & securely processed
              </div>
            </div>
            <div className="hidden rounded-2xl border border-white/[0.08] bg-black/10 p-4 sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Powered by</p>
              <p className="mt-2 text-sm font-medium text-white">AI document engine</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Built for fast, context-aware Indian legal drafting.</p>
            </div>
          </aside>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
          Usually ready in under 60 seconds · Please keep this window open
        </div>
      </main>
    </div>
  );
}

// ── Guest Success Page (secure download link + 7-day edit access) ─────────────
function GuestSuccessView({
  title, blobUrl, access, onAnother,
}: {
  title: string; blobUrl: string | null; access: PaidAccess | null;
  onAnother: () => void;
}) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  function reDownload() {
    if (!blobUrl) { toast({ title: "File expired", description: "Please use the secure download link below.", variant: "destructive" }); return; }
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${title.replace(/\s+/g, "-")}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  const editUntil = access?.editExpiresAt
    ? new Date(access.editExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

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
            {access?.downloadToken && (
              <Button
                onClick={() => window.open(`${BASE}/api/documents/download/${access.downloadToken}`, "_blank")}
                variant="outline"
                className="w-full h-11 text-sm">
                <ShieldCheck className="mr-2 h-4 w-4" /> Secure download link (24 hrs)
              </Button>
            )}
            <Button onClick={onAnother} variant="ghost"
              className="w-full h-10 text-muted-foreground text-sm hover:text-white">
              <Sparkles className="mr-2 h-4 w-4" /> Generate Another Document
            </Button>
          </motion.div>
        </div>

        {/* 7-day edit access — edit access, NOT a refund */}
        {access?.editToken && (
          <div className="bg-card border border-primary/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <PenLine className="h-4 w-4 text-primary" />
              <p className="text-white text-sm font-bold">Free edits for 7 days</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Spotted a typo or need to change a detail? Edit your inputs and regenerate
              this document free until <span className="text-white font-medium">{editUntil}</span>.
            </p>
            <Button
              onClick={() => setLocation(`/documents/edit?token=${access.editToken}`)}
              variant="outline" className="w-full h-10 text-sm border-primary/30 text-primary hover:bg-primary/10">
              <PenLine className="mr-2 h-4 w-4" /> Edit this document
            </Button>
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground/70">
          No account required. Keep your downloaded PDF somewhere safe for future access.
        </div>
      </div>
    </motion.div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function GenerateDocument() {
  const { type } = useParams<{ type: string }>();
  const [, setLocation] = useLocation();
  const { t, language: appLang } = useLanguage();
  const { toast } = useToast();

  const docConfig = DOCUMENTS[type as keyof typeof DOCUMENTS];
  const fields: string[] = docConfig?.fields ?? [];

  // ── Phase & state ─────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("wizard");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    try { const s = localStorage.getItem(`kanoon_wizard_${type}`); return s ? JSON.parse(s) : {}; }
    catch { return {}; }
  });
  const [docLanguage, setDocLanguage] = useState("en");
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [showLangPicker, setShowLangPicker] = useState(false);

  // Streaming
  const [streamText, setStreamText] = useState("");
  const [stageIdx, setStageIdx] = useState(0);
  const [repairing, setRepairing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // Locked phase
  const [generatedDoc, setGeneratedDoc] = useState<PendingDoc | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [guestPdfBlobUrl, setGuestPdfBlobUrl] = useState<string | null>(null);
  const [paidAccess, setPaidAccess] = useState<PaidAccess | null>(null);

  // ── Auto-save wizard ───────────────────────────────────────────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(`kanoon_wizard_${type}`, JSON.stringify(formData)); } catch {}
    }, 600);
  }, [formData, type]);

  // ── Stream stage ticker ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "streaming") return;
    const id = setInterval(() => setStageIdx((i) => Math.min(i + 1, STREAM_STAGES.length - 1)), 3800);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    setWordCount(streamText.split(/\s+/).filter(Boolean).length);
  }, [streamText]);

  // ── SEO ───────────────────────────────────────────────────────────────────
  useSeo({
    title: docConfig
      ? `Generate ${docConfig.name} — Kanoon AI | AI Legal Document India`
      : "Generate Legal Document — Kanoon AI",
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

  // ── Razorpay payment (guest — order binds to the server-stored document) ──────
  async function openGuestRazorpay(pending: PendingDoc) {
    setIsPaying(true);
    try {
      if (!pending.documentId) {
        throw new Error("Document expired — please generate it again.");
      }
      await loadRazorpay();
      const orderRes = await guestFetch(`${BASE}/api/payments/guest-create-order`, {
        method: "POST",
        body: JSON.stringify({ documentId: pending.documentId }),
      });
      if (!orderRes.ok) throw new Error("Could not create payment order");
      const order = await orderRes.json();

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: "INR",
        name: "Kanoon AI",
        description: pending.title,
        order_id: order.orderId,
        prefill: {},
        theme: { color: "#F5C518" },
        handler: async (response: any) => {
          try {
            // Only the Razorpay result goes to the server. The final PDF is
            // rendered from the server-stored document — never from the client.
            const deliverRes = await guestFetch(`${BASE}/api/payments/guest-deliver`, {
              method: "POST",
              body: JSON.stringify({
                orderId:   response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });
            if (!deliverRes.ok) {
              const e = await deliverRes.json().catch(() => ({}));
              throw new Error((e as any).error || "PDF delivery failed");
            }
            const blob   = await deliverRes.blob();
            const blobUrl = URL.createObjectURL(blob);
            // Secure access tokens issued by the server (response headers).
            const access: PaidAccess = {
              documentId:    deliverRes.headers.get("X-Document-Id") ?? pending.documentId!,
              downloadToken: deliverRes.headers.get("X-Download-Token") ?? "",
              editToken:     deliverRes.headers.get("X-Edit-Token"),
              editExpiresAt: deliverRes.headers.get("X-Edit-Expires-At") ?? "",
            };
            try {
              localStorage.setItem(
                `kanoon_access_${access.documentId}`,
                JSON.stringify(access),
              );
            } catch {}
            // Auto-download
            const a = document.createElement("a");
            a.href     = blobUrl;
            a.download = `${pending.title.replace(/\s+/g, "-")}.pdf`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            // Show guest success
            setGuestPdfBlobUrl(blobUrl);
            setPaidAccess(access);
            setPhase("success");
            try { localStorage.removeItem(PENDING_KEY); } catch {}
            try { localStorage.removeItem(`kanoon_wizard_${type}`); } catch {}
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

  // ── Submit wizard — start generation ──────────────────────────────────────
  async function handleGenerate() {
    abortRef.current = new AbortController();
    setPhase("streaming");
    setStreamText("");
    setStageIdx(0);
    setRepairing(false);

    const endpoint = `${BASE}/api/documents/stream/guest`;

    try {
      const res = await guestFetch(endpoint, {
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
          let payload: any;
          try {
            payload = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (payload.error) throw new Error(payload.error);
          if (payload.repairing) {
            setRepairing(true);
          } else if (payload.chunk) {
            fullContent += payload.chunk;
            setStreamText((p) => p + payload.chunk);
          } else if (payload.done) {
            const pending: PendingDoc = {
              type: type!, formData,
              documentId: payload.documentId ?? null,
              content: fullContent,
              language: docLanguage,
              title: payload.title ?? docConfig.name,
              price: payload.price ?? docConfig.price,
            };
            setGeneratedDoc(pending);
            try { localStorage.setItem(PENDING_KEY, JSON.stringify(pending)); } catch {}
            setPhase("locked");
            return;
          }
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setPhase("wizard");
      toast({ title: "Generation failed", description: err?.message, variant: "destructive" });
    }
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <GuestSuccessView
        title={generatedDoc?.title ?? docConfig.name}
        blobUrl={guestPdfBlobUrl}
        access={paidAccess}
        onAnother={() => setLocation("/documents")}
      />
    );
  }

  // ── PAYMENT WAITING (opening Razorpay) ────────────────────────────────────
  if (phase === "payment") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full" />
        <p className="text-white font-medium">
          Opening payment…
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
            className="text-muted-foreground hover:text-white h-10 w-10 shrink-0">
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
                onPay={() => openGuestRazorpay(generatedDoc)}
                isPaying={isPaying}
              />
            </motion.div>
          </div>
        </div>

        {/* Mobile sticky CTA */}
        <div className="lg:hidden sticky bottom-0 bg-card/95 backdrop-blur border-t border-white/10 p-4">
          <Button onClick={() => openGuestRazorpay(generatedDoc)} disabled={isPaying}
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
      <>
        {repairing && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold backdrop-blur">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Repairing draft — one moment…
          </div>
        )}
        <DocumentGenerationExperience
          documentName={docConfig.name}
          streamText={streamText}
          stageIdx={stageIdx}
          progress={prog}
          wordCount={wordCount}
          onCancel={() => { abortRef.current?.abort(); setPhase("wizard"); }}
        />
      </>
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
          className="text-muted-foreground hover:text-white h-10 w-10 shrink-0">
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
      <div className="flex lg:hidden sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-white/10">
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
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" />AI</span>
                <span>Free preview · ₹{docConfig.price} to download</span>
              </div>
              <button onClick={() => {
                if (confirm("Clear all answers and start over?")) {
                  setFormData({}); setStep(0);
                  try { localStorage.removeItem(`kanoon_wizard_${type}`); } catch {}
                }
              }} className="flex items-center gap-1 hover:text-muted-foreground transition-colors">
                <RotateCcw className="h-3 w-3" />Reset
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Live preview (desktop split view; mobile uses the dedicated preview block below) */}
        <div className="hidden lg:flex flex-col w-[48%] border-l border-white/10 bg-black/20 overflow-hidden">
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
