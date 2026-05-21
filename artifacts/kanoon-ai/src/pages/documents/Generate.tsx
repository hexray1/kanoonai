import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Zap, Shield, Globe,
  Sparkles, ChevronRight, Eye, FileText, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCUMENTS, FIELD_LABELS } from "@/lib/constants";
import { getFieldConfig, INDIAN_STATES, type FieldConfig } from "@/lib/fieldConfig";
import { buildDocumentPreview } from "@/lib/documentTemplates";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { authFetch } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिंदी",   flag: "🇮🇳" },
  { code: "mr", label: "मराठी",  flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்",  flag: "🇮🇳" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳" },
];

const STREAM_STAGES = [
  "Connecting to NVIDIA Nemotron...",
  "Analyzing Indian legal requirements...",
  "Drafting parties & recitals...",
  "Writing legal clauses & provisions...",
  "Adding jurisdiction & dispute resolution...",
  "Finalizing signature & witness blocks...",
];

// ── Animated field slide transition ──────────────────────────────────────────
const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 48 : -48, opacity: 0 }),
};

// ── Field Input Component ─────────────────────────────────────────────────────
function FieldInput({
  fieldKey, config, value, onChange, onEnter, language,
}: {
  fieldKey: string;
  config: FieldConfig;
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  language: string;
}) {
  const label = FIELD_LABELS[fieldKey];
  const placeholder = label?.placeholder ?? "";

  const baseInputCls =
    "w-full bg-background/60 border border-white/20 text-white text-lg px-5 py-4 rounded-xl " +
    "focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/50 " +
    "transition-all autofill:bg-background";

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && config.type !== "textarea") {
      e.preventDefault();
      onEnter();
    }
  };

  if (config.type === "select") {
    return (
      <select
        className={baseInputCls + " cursor-pointer"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      >
        <option value="">Select {label?.en ?? fieldKey}</option>
        {(config.options ?? []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (config.type === "textarea") {
    return (
      <textarea
        className={baseInputCls + " resize-none min-h-[140px]"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        autoFocus
      />
    );
  }

  if (config.type === "date") {
    return (
      <input
        type="date"
        className={baseInputCls + " [color-scheme:dark]"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        autoFocus
      />
    );
  }

  if (config.type === "currency" || config.type === "number") {
    return (
      <div className="relative">
        {config.prefix && (
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl text-muted-foreground font-medium pointer-events-none">
            {config.prefix}
          </span>
        )}
        <input
          type="number"
          className={baseInputCls + (config.prefix ? " pl-10" : "")}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          min={config.min}
          max={config.max}
          autoFocus
        />
        {config.suffix && (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {config.suffix}
          </span>
        )}
      </div>
    );
  }

  return (
    <input
      type="text"
      className={baseInputCls}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKey}
      autoFocus
    />
  );
}

// ── Completed Answer Pill ─────────────────────────────────────────────────────
function AnswerPill({
  fieldKey, value, onClick,
}: { fieldKey: string; value: string; onClick: () => void }) {
  const label = FIELD_LABELS[fieldKey];
  const display =
    value.length > 24
      ? value.substring(0, 22) + "…"
      : value || "—";
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary hover:bg-primary/20 transition-colors"
    >
      <Check className="h-3 w-3" />
      <span className="text-muted-foreground">{label?.en ?? fieldKey}:</span>
      <span className="font-medium truncate max-w-[80px]">{display}</span>
    </button>
  );
}

// ── Mobile Tab Bar ────────────────────────────────────────────────────────────
function MobileTabBar({
  tab, onChange,
}: { tab: "form" | "preview"; onChange: (t: "form" | "preview") => void }) {
  return (
    <div className="flex lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-white/10">
      {(["form", "preview"] as const).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            tab === t
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
        >
          {t === "form" ? <FileText className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {t === "form" ? "Form" : "Live Preview"}
        </button>
      ))}
    </div>
  );
}

// ── Main Generate Component ───────────────────────────────────────────────────
export default function GenerateDocument() {
  const { type } = useParams<{ type: string }>();
  const [, setLocation] = useLocation();
  const { t, language: appLang } = useLanguage();
  const { toast } = useToast();

  const docConfig = DOCUMENTS[type as keyof typeof DOCUMENTS];
  const fields: string[] = docConfig?.fields ?? [];

  // ── Wizard State ──────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`kanoox_wizard_${type}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [docLanguage, setDocLanguage] = useState("en");
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [showLangPicker, setShowLangPicker] = useState(false);

  // ── Streaming State ───────────────────────────────────────────────────────
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [stageIdx, setStageIdx] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const streamRef = useRef<HTMLPreElement>(null);

  // ── Preview HTML ──────────────────────────────────────────────────────────
  const previewHtml = docConfig
    ? buildDocumentPreview(type!, formData, docConfig.name)
    : "";

  // ── Auto-save ─────────────────────────────────────────────────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceSave = useCallback((data: Record<string, string>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(`kanoox_wizard_${type}`, JSON.stringify(data)); } catch {}
    }, 600);
  }, [type]);

  useEffect(() => { debounceSave(formData); }, [formData, debounceSave]);

  // ── Stage ticker during streaming ─────────────────────────────────────────
  useEffect(() => {
    if (!isStreaming) return;
    const id = setInterval(() => setStageIdx((i) => Math.min(i + 1, STREAM_STAGES.length - 1)), 3800);
    return () => clearInterval(id);
  }, [isStreaming]);

  // ── Auto-scroll stream ────────────────────────────────────────────────────
  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
    setWordCount(streamText.split(/\s+/).filter(Boolean).length);
  }, [streamText]);

  useSeo({
    title: docConfig
      ? `Generate ${docConfig.name} Online — Kanoox AI | Instant Indian Legal Draft`
      : "Generate Legal Document — Kanoox AI",
    description: docConfig
      ? `Create a ${docConfig.name} in 60 seconds with NVIDIA AI. Legally compliant, lawyer-reviewed. Free preview. From ₹${docConfig.price}.`
      : undefined,
  });

  if (!docConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Document type not found.</p>
          <Button onClick={() => setLocation("/documents")} variant="outline">Browse Templates</Button>
        </div>
      </div>
    );
  }

  const currentFieldKey = fields[step] ?? "";
  const currentConfig = getFieldConfig(currentFieldKey);
  const currentValue = formData[currentFieldKey] ?? "";
  const completedCount = fields.filter((f) => !!formData[f]).length;
  const progress = fields.length > 0 ? (completedCount / fields.length) * 100 : 0;
  const isLastStep = step === fields.length - 1;

  const goTo = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(Math.max(0, Math.min(newStep, fields.length - 1)));
  };

  const setCurrentValue = (v: string) => {
    setFormData((prev) => ({ ...prev, [currentFieldKey]: v }));
  };

  const handleNext = () => {
    if (isLastStep) handleSubmit();
    else goTo(step + 1);
  };

  const handleSubmit = async () => {
    const missing = fields.filter((f) => {
      const v = formData[f];
      return !v || v.trim() === "";
    });
    if (missing.length > 3) {
      toast({ title: "Almost there!", description: `Please fill in ${missing.length} more field(s) first.`, variant: "destructive" });
      goTo(fields.indexOf(missing[0]));
      return;
    }

    abortRef.current = new AbortController();
    setIsStreaming(true);
    setStreamText("");
    setStageIdx(0);

    try {
      const res = await authFetch(`${BASE}/api/documents/stream`, {
        method: "POST",
        body: JSON.stringify({ type, formData, language: docLanguage }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || `Server error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

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
            if (payload.chunk) setStreamText((p) => p + payload.chunk);
            else if (payload.done && payload.docId) {
              try { localStorage.removeItem(`kanoox_wizard_${type}`); } catch {}
              toast({ title: "Document Ready!", description: "Your AI-drafted document is ready to preview." });
              setLocation(`/documents/${payload.docId}/preview`);
              return;
            } else if (payload.error) throw new Error(payload.error);
          } catch {}
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setIsStreaming(false);
      toast({ title: "Generation Failed", description: err?.message || "Please try again.", variant: "destructive" });
    }
  };

  // ── STREAMING VIEW ────────────────────────────────────────────────────────
  if (isStreaming) {
    const prog = Math.min(10 + (streamText.length / 8000) * 85, 95);
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-white/10 bg-card/80 backdrop-blur px-5 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-[#76b900]/10 rounded-lg flex items-center justify-center border border-[#76b900]/30">
              <Zap className="h-4 w-4 text-[#76b900]" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-none">{docConfig.name}</p>
              <p className="text-[#76b900] text-xs mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#76b900] rounded-full animate-pulse inline-block" />
                NVIDIA Nemotron 70B writing...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{wordCount.toLocaleString()} words</span>
            <button onClick={() => { abortRef.current?.abort(); setIsStreaming(false); }} className="text-red-400 hover:text-red-300">Cancel</button>
          </div>
        </div>

        <div className="h-0.5 bg-white/5">
          <motion.div className="h-full bg-[#76b900]" animate={{ width: `${prog}%` }} transition={{ duration: 0.5 }} />
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-56 shrink-0 border-r border-white/10 bg-card/50 p-5 hidden md:flex flex-col gap-4">
            <div className="bg-[#76b900]/5 border border-[#76b900]/20 rounded-xl p-4">
              <p className="text-[#76b900] text-xs font-bold uppercase tracking-wider mb-3">AI Status</p>
              <div className="space-y-2">
                {STREAM_STAGES.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${i < stageIdx ? "bg-[#76b900]" : i === stageIdx ? "bg-[#76b900] animate-pulse" : "bg-white/20"}`} />
                    <span className={`text-xs ${i <= stageIdx ? "text-white" : "text-muted-foreground"}`}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-background/60 border border-white/5 rounded-xl p-3 text-xs space-y-1.5 text-muted-foreground">
              <p className="text-white font-medium">Document</p>
              <p>Type: <span className="text-white">{docConfig.name}</span></p>
              <p>Lang: <span className="text-white">{LANGS.find(l => l.code === docLanguage)?.label}</span></p>
              <p>Words: <span className="text-[#76b900]">{wordCount.toLocaleString()}</span></p>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden relative">
              {streamText ? (
                <pre ref={streamRef}
                  className="h-full overflow-auto p-6 text-sm text-white/90 font-mono leading-relaxed whitespace-pre-wrap break-words"
                  style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                  {streamText}
                  <span className="inline-block w-2 h-4 bg-[#76b900] ml-0.5 animate-pulse align-middle" />
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-14 h-14 border-4 border-[#76b900]/20 border-t-[#76b900] rounded-full mx-auto mb-4" />
                    <p className="text-white font-medium">{STREAM_STAGES[stageIdx]}</p>
                    <p className="text-muted-foreground text-sm mt-1">Powered by NVIDIA Nemotron 70B</p>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-white/10 bg-card/50 px-5 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
              <AnimatePresence mode="wait">
                <motion.span key={stageIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 text-[#76b900]">
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

  // ── WIZARD + SPLIT SCREEN ─────────────────────────────────────────────────
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
        <Button variant="ghost" size="icon" onClick={() => setLocation("/documents")} className="text-muted-foreground hover:text-white h-8 w-8 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white text-sm font-semibold truncate">{docConfig.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:block">
                {completedCount}/{fields.length} fields · ₹{docConfig.price}
              </span>
              <button onClick={() => setShowLangPicker(p => !p)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground hover:text-white transition-colors">
                <Globe className="h-3 w-3" />
                {LANGS.find(l => l.code === docLanguage)?.label}
              </button>
            </div>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full"
              animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
          </div>
        </div>
      </div>

      {/* Language picker dropdown */}
      <AnimatePresence>
        {showLangPicker && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute top-16 right-4 z-40 bg-card border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-1.5">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => { setDocLanguage(l.code); setShowLangPicker(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${docLanguage === l.code ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}>
                <span>{l.flag}</span>{l.label}{docLanguage === l.code && <Check className="h-3 w-3 ml-auto" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile tabs */}
      <MobileTabBar tab={mobileTab} onChange={setMobileTab} />

      {/* Main 2-panel layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Wizard Panel ─────────────────────────────────────────── */}
        <div className={`w-full lg:w-[52%] flex flex-col overflow-y-auto ${mobileTab === "preview" ? "hidden lg:flex" : "flex"}`}>
          <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col">

            {/* Completed answers */}
            {completedCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {fields.slice(0, step).map((fk) =>
                  formData[fk] ? (
                    <AnswerPill key={fk} fieldKey={fk} value={formData[fk]} onClick={() => goTo(fields.indexOf(fk))} />
                  ) : null
                )}
              </div>
            )}

            {/* Active wizard step */}
            <div className="flex-1 flex flex-col justify-center max-w-lg">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div key={step} custom={direction} variants={stepVariants}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="space-y-5">

                  {/* Step indicator + emoji */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{currentConfig.emoji ?? "✏️"}</span>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Step {step + 1} of {fields.length}
                    </span>
                  </div>

                  {/* Question */}
                  <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                    {question}
                  </h2>

                  {/* Input */}
                  <FieldInput
                    fieldKey={currentFieldKey}
                    config={currentConfig}
                    value={currentValue}
                    onChange={setCurrentValue}
                    onEnter={handleNext}
                    language={appLang}
                  />

                  {/* AI Tip */}
                  {aiTip && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      className="flex items-start gap-2.5 px-4 py-3 bg-primary/5 border border-primary/15 rounded-xl">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{aiTip}</p>
                    </motion.div>
                  )}

                  {/* Press Enter hint */}
                  {currentConfig.type !== "textarea" && currentConfig.type !== "select" && (
                    <p className="text-xs text-muted-foreground/50">
                      Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Enter ↵</kbd> to continue
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="pt-8 flex items-center justify-between gap-4">
              <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0}
                className="text-muted-foreground hover:text-white gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>

              <div className="flex items-center gap-3">
                {!isLastStep && currentValue === "" && (
                  <button onClick={() => goTo(step + 1)}
                    className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors underline-offset-2 hover:underline">
                    Skip
                  </button>
                )}

                <Button onClick={handleNext}
                  className="h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold font-bold group gap-2">
                  {isLastStep
                    ? <><Sparkles className="h-4 w-4" />Generate with AI</>
                    : <>Next <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></>
                  }
                </Button>
              </div>
            </div>

            {/* Trust / reset row */}
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground/50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" />SSL</span>
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" />NVIDIA AI</span>
                <span>₹{docConfig.price} to download</span>
              </div>
              <button onClick={() => {
                if (confirm("Clear all answers and start over?")) {
                  setFormData({});
                  setStep(0);
                  try { localStorage.removeItem(`kanoox_wizard_${type}`); } catch {}
                }
              }} className="flex items-center gap-1 hover:text-muted-foreground transition-colors">
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Live Preview Panel ──────────────────────────────────── */}
        <div className={`hidden lg:flex flex-col w-[48%] border-l border-white/10 bg-black/20 overflow-hidden ${mobileTab === "preview" ? "!flex w-full" : ""}`}>
          {/* Preview header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-card/50 shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-white">Live Preview</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                UPDATES LIVE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {completedCount} of {fields.length} fields filled
            </div>
          </div>

          {/* Preview iframe */}
          <div className="flex-1 overflow-hidden bg-[#1a1a1a] p-4">
            <div className="h-full rounded-xl overflow-hidden shadow-2xl border border-white/5">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full"
                title="Live document preview"
                sandbox="allow-same-origin"
                scrolling="yes"
              />
            </div>
          </div>

          {/* Preview footer CTA */}
          <div className="px-5 py-3 border-t border-white/10 bg-card/50 shrink-0 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">Free</span> to draft & preview ·
              Pay <span className="text-primary font-medium">₹{docConfig.price}</span> to unlock PDF
            </p>
            <Button size="sm" onClick={handleSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs gap-1 shadow-gold">
              <Sparkles className="h-3 w-3" /> Generate Now
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile: preview tab content */}
      {mobileTab === "preview" && (
        <div className="flex lg:hidden flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden bg-[#1a1a1a] p-3">
            <div className="h-full rounded-xl overflow-hidden shadow-2xl border border-white/5">
              <iframe srcDoc={previewHtml} className="w-full h-full" title="Live document preview"
                sandbox="allow-same-origin" scrolling="yes" />
            </div>
          </div>
          <div className="px-4 py-3 border-t border-white/10 bg-card/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Free preview · ₹{docConfig.price} to download</p>
            <Button size="sm" onClick={() => setMobileTab("form")}
              className="bg-primary text-primary-foreground h-8 text-xs gap-1">
              Continue Form →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
