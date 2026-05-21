import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Bot, Sparkles, Globe, Shield, Clock, Check,
  FileText, Zap, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DOCUMENTS, FIELD_LABELS } from "@/lib/constants";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { authFetch } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const LONG_TEXT_FIELDS = new Set([
  "statement_details", "statement_purpose", "notice_details", "incident_description",
  "complaint_details", "information_sought", "scope_of_work", "beneficiary_details",
  "family_members", "items_description", "grounds_for_divorce", "relief_sought",
  "complaint_subject",
]);

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिंदी",   flag: "🇮🇳" },
  { code: "mr", label: "मराठी",  flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்",  flag: "🇮🇳" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳" },
];

const STREAM_STAGES = [
  "Connecting to NVIDIA AI...",
  "Analyzing legal requirements...",
  "Drafting document structure...",
  "Writing clauses & provisions...",
  "Adding witness & attestation blocks...",
  "Finalizing your legal document...",
];

export default function GenerateDocument() {
  const { type } = useParams<{ type: string }>();
  const [, setLocation] = useLocation();
  const { t, language: appLang } = useLanguage();
  const { toast } = useToast();

  const [docLanguage, setDocLanguage] = useState<string>(appLang);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [stageIdx, setStageIdx] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const streamRef = useRef<HTMLPreElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const docConfig = DOCUMENTS[type as keyof typeof DOCUMENTS];
  const { register, handleSubmit, formState: { errors } } = useForm();

  useSeo({
    title: docConfig
      ? `Generate ${docConfig.name} Online — Kanoox AI | Instant Legal Draft`
      : "Generate Legal Document — Kanoox AI",
    description: docConfig
      ? `Create a ${docConfig.name} instantly with NVIDIA AI. Legally compliant, lawyer-reviewed template. Ready in 60 seconds. From ₹${docConfig.price}.`
      : undefined,
  });

  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setStageIdx((i) => Math.min(i + 1, STREAM_STAGES.length - 1));
    }, 3500);
    return () => clearInterval(interval);
  }, [isStreaming]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
    setWordCount(streamText.split(/\s+/).filter(Boolean).length);
  }, [streamText]);

  if (!docConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Document type not found.</p>
          <Button onClick={() => setLocation("/documents")} variant="outline">
            Browse Templates
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: any) => {
    abortRef.current = new AbortController();
    setIsStreaming(true);
    setStreamText("");
    setStageIdx(0);

    try {
      const response = await authFetch(`${BASE}/api/documents/stream`, {
        method: "POST",
        body: JSON.stringify({ type, formData: data, language: docLanguage }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.chunk) {
              setStreamText((prev) => prev + payload.chunk);
            } else if (payload.done && payload.docId) {
              toast({
                title: "Document Ready!",
                description: "Preview your document and unlock the full PDF.",
              });
              setLocation(`/documents/${payload.docId}/preview`);
              return;
            } else if (payload.error) {
              throw new Error(payload.error);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setIsStreaming(false);
      toast({
        title: "Generation Failed",
        description: err?.message || "NVIDIA AI generation failed — please try again.",
        variant: "destructive",
      });
    }
  };

  // ── Streaming view ─────────────────────────────────────────────────────────
  if (isStreaming) {
    const progress = Math.min(
      10 + (streamText.length / 8000) * 85,
      stageIdx >= STREAM_STAGES.length - 1 ? 95 : 100,
    );

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top bar */}
        <div className="border-b border-white/10 bg-card/80 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-[#76b900]/10 rounded-lg flex items-center justify-center border border-[#76b900]/30">
              <Zap className="h-4 w-4 text-[#76b900]" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-none">
                {docConfig.name}
              </p>
              <p className="text-[#76b900] text-xs mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-[#76b900] rounded-full animate-pulse" />
                NVIDIA Nemotron generating...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{wordCount.toLocaleString()} words</span>
            <button
              onClick={() => {
                abortRef.current?.abort();
                setIsStreaming(false);
              }}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/5">
          <motion.div
            className="h-full bg-[#76b900]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar - AI status */}
          <div className="w-64 shrink-0 border-r border-white/10 bg-card/50 p-5 hidden md:flex flex-col gap-4">
            <div className="bg-[#76b900]/5 border border-[#76b900]/20 rounded-xl p-4">
              <p className="text-[#76b900] text-xs font-bold uppercase tracking-wider mb-3">
                NVIDIA AI Status
              </p>
              <div className="space-y-2.5">
                {STREAM_STAGES.map((stage, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      i < stageIdx ? "bg-[#76b900]" :
                      i === stageIdx ? "bg-[#76b900] animate-pulse" :
                      "bg-white/20"
                    }`} />
                    <span className={`text-xs ${
                      i <= stageIdx ? "text-white" : "text-muted-foreground"
                    }`}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-background/60 border border-white/5 rounded-xl p-4 text-xs space-y-2 text-muted-foreground">
              <p className="text-white font-medium mb-1">Document info</p>
              <p>Type: <span className="text-white">{docConfig.name}</span></p>
              <p>Language: <span className="text-white">{LANGUAGES.find(l => l.code === docLanguage)?.label}</span></p>
              <p>Words: <span className="text-[#76b900]">{wordCount.toLocaleString()}</span></p>
              <p>Model: <span className="text-[#76b900]">Nemotron 70B</span></p>
            </div>

            <div className="mt-auto">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                SSL encrypted
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                Lawyer-reviewed template
              </div>
            </div>
          </div>

          {/* Main streaming area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 relative overflow-hidden">
              {streamText ? (
                <pre
                  ref={streamRef}
                  className="h-full overflow-auto p-6 text-sm text-white/90 font-mono leading-relaxed whitespace-pre-wrap break-words"
                  style={{ fontFamily: "'Courier New', Courier, monospace" }}
                >
                  {streamText}
                  <span className="inline-block w-2 h-4 bg-[#76b900] ml-0.5 animate-pulse align-middle" />
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-[#76b900]/20 border-t-[#76b900] rounded-full mx-auto mb-4"
                    />
                    <p className="text-white font-medium">{STREAM_STAGES[stageIdx]}</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Powered by NVIDIA Nemotron 70B
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom status bar */}
            <div className="border-t border-white/10 bg-card/50 px-6 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
              <AnimatePresence mode="wait">
                <motion.span
                  key={stageIdx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 text-[#76b900]"
                >
                  <Sparkles className="h-3 w-3" />
                  {STREAM_STAGES[stageIdx]}
                </motion.span>
              </AnimatePresence>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-[#76b900]" />
                Powered by NVIDIA AI
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => setLocation("/documents")}
          className="mb-6 text-muted-foreground hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("Back to templates", "टेम्पलेट्स पर वापस")}
        </Button>

        <div className="bg-card border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-white/10 pb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {t(docConfig.name, docConfig.nameHi)}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-muted-foreground text-sm">
                    {t("Fill in the details. Our AI will craft a legally-sound draft.", "विवरण भरें। हमारा एआई कानूनी मसौदा तैयार करेगा।")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 bg-[#76b900]/10 border border-[#76b900]/30 text-[#76b900] text-xs font-semibold px-3 py-1.5 rounded-full">
                <Zap className="h-3 w-3" />
                NVIDIA Nemotron 70B
              </div>
              <span className="text-3xl font-bold text-primary">₹{docConfig.price}</span>
              <span className="text-[10px] text-muted-foreground">+ 18% GST</span>
            </div>
          </div>

          {/* Language selector */}
          <div className="mb-6 relative z-10">
            <Label className="text-white text-sm flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-primary" />
              {t("Document Language", "दस्तावेज़ की भाषा")}
            </Label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setDocLanguage(lang.code)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    docLanguage === lang.code
                      ? "bg-primary/10 border-primary text-primary shadow-gold"
                      : "bg-background border-white/10 text-muted-foreground hover:border-white/30 hover:text-white"
                  }`}
                >
                  <span className="mr-1.5">{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form fields */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {docConfig.fields.map((fieldKey) => {
                const labelInfo = FIELD_LABELS[fieldKey] || {
                  en: fieldKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                  hi: fieldKey,
                  placeholder: "",
                };
                const isLong = LONG_TEXT_FIELDS.has(fieldKey);
                return (
                  <div key={fieldKey} className={`space-y-2 ${isLong ? "md:col-span-2" : ""}`}>
                    <Label htmlFor={fieldKey} className="text-white text-sm">
                      {appLang === "en" ? labelInfo.en : labelInfo.hi}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    {isLong ? (
                      <textarea
                        id={fieldKey}
                        placeholder={labelInfo.placeholder}
                        rows={4}
                        className="flex w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[100px]"
                        {...register(fieldKey, { required: true, minLength: 5 })}
                      />
                    ) : (
                      <Input
                        id={fieldKey}
                        placeholder={labelInfo.placeholder}
                        className="bg-background border-white/10 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                        {...register(fieldKey, { required: true })}
                      />
                    )}
                    {errors[fieldKey] && (
                      <span className="text-xs text-red-500">
                        {t("This field is required", "यह फ़ील्ड आवश्यक है")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              {[
                { icon: Shield,   text: "SSL Encrypted" },
                { icon: Clock,    text: "Live streaming draft" },
                { icon: Check,    text: "Lawyer-reviewed" },
                { icon: Zap,      text: "NVIDIA Nemotron AI" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.text}
                    className="flex items-center gap-2 px-3 py-2 bg-background/40 border border-white/5 rounded-lg text-xs text-muted-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    {item.text}
                  </div>
                );
              })}
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-yellow-500 text-primary-foreground hover:opacity-95 shadow-gold group"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {t("Generate Document with AI", "AI से दस्तावेज़ बनाएँ")}
                <ChevronRight className="ml-auto h-5 w-5 group-hover:translate-x-1 transition-transform" />
                <span className="ml-1 px-2 py-0.5 bg-black/20 rounded-md text-xs">
                  ₹{docConfig.price}
                </span>
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                {t(
                  "Free to draft · Pay only to download the final PDF · Powered by NVIDIA AI",
                  "ड्राफ्ट मुफ्त · केवल PDF डाउनलोड के लिए भुगतान · NVIDIA AI द्वारा संचालित",
                )}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
