import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Bot, Sparkles, Globe, Shield, Clock, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGenerateDocument } from "@workspace/api-client-react";
import { DOCUMENTS, FIELD_LABELS } from "@/lib/constants";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

const LONG_TEXT_FIELDS = new Set([
  "statement_details", "statement_purpose", "notice_details", "incident_description",
  "complaint_details", "information_sought", "scope_of_work", "beneficiary_details",
  "family_members", "items_description", "grounds_for_divorce", "relief_sought",
  "complaint_subject",
]);

const LANGUAGES = [
  { code: "en", label: "English",  flag: "🇬🇧" },
  { code: "hi", label: "हिंदी",     flag: "🇮🇳" },
  { code: "mr", label: "मराठी",    flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்",    flag: "🇮🇳" },
  { code: "te", label: "తెలుగు",  flag: "🇮🇳" },
];

const AI_STAGES = [
  { msg: "Analyzing your inputs...", icon: Bot, ms: 1500 },
  { msg: "Loading Indian legal templates...", icon: Shield, ms: 1800 },
  { msg: "Drafting clauses with Claude AI...", icon: Sparkles, ms: 2500 },
  { msg: "Adding witness & legal sections...", icon: FileText, ms: 1500 },
  { msg: "Finalizing your document...", icon: Check, ms: 1200 },
];

export default function GenerateDocument() {
  const { type } = useParams<{ type: string }>();
  const [, setLocation] = useLocation();
  const { t, language: appLang } = useLanguage();
  const { toast } = useToast();

  const [docLanguage, setDocLanguage] = useState<string>(appLang);
  const [stageIdx, setStageIdx] = useState(0);
  const language = appLang;

  const docConfig = DOCUMENTS[type as keyof typeof DOCUMENTS];
  const generateMutation = useGenerateDocument();
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Cycle through AI stages while generating
  useEffect(() => {
    if (!generateMutation.isPending) {
      setStageIdx(0);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % AI_STAGES.length;
      setStageIdx(i);
    }, AI_STAGES[stageIdx]?.ms || 1500);
    return () => clearInterval(interval);
  }, [generateMutation.isPending]);

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
    try {
      const res = await generateMutation.mutateAsync({
        data: { type, formData: data, language: docLanguage as any },
      });
      toast({ title: "Document Generated!", description: "Preview your document and unlock to download." });
      setLocation(`/documents/${res.id}/preview`);
    } catch (err: any) {
      toast({
        title: "Generation Failed",
        description: err?.message || "AI generation failed — please try again.",
        variant: "destructive",
      });
    }
  };

  // ---- AI generation overlay ----
  if (generateMutation.isPending) {
    const Stage = AI_STAGES[stageIdx];
    const StageIcon = Stage.icon;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center bg-card/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-10 relative z-10 shadow-gold"
        >
          <div className="mb-8 relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 mx-auto w-28 h-28 border-4 border-primary/20 border-t-primary rounded-full"
            />
            <div className="relative w-28 h-28 mx-auto bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/30">
              <Bot className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Crafting Your Document
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            {language === "en" ? docConfig.name : docConfig.nameHi} · Powered by Claude AI
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={stageIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center gap-3 text-primary font-medium mb-6"
            >
              <StageIcon className="h-5 w-5" />
              <span>{Stage.msg}</span>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5">
            {AI_STAGES.map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: i <= stageIdx ? 1 : 0.3, scale: i === stageIdx ? 1.3 : 1 }}
                className="h-1.5 w-8 bg-primary rounded-full"
              />
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-8 flex items-center justify-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            This usually takes 15–30 seconds
          </p>
        </motion.div>
      </div>
    );
  }

  // ---- Form ----
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <Button variant="ghost" onClick={() => setLocation("/documents")} className="mb-6 text-muted-foreground hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back to templates", "टेम्पलेट्स पर वापस")}
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
                  {language === "en" ? docConfig.name : docConfig.nameHi}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t(
                    "Fill in the details. Our AI will craft a legally-sound draft.",
                    "विवरण भरें। हमारा एआई एक कानूनी मसौदा तैयार करेगा।"
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Price</span>
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
                  <div
                    key={fieldKey}
                    className={`space-y-2 ${isLong ? "md:col-span-2" : ""}`}
                  >
                    <Label htmlFor={fieldKey} className="text-white text-sm">
                      {language === "en" ? labelInfo.en : labelInfo.hi}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { icon: Shield,    text: "SSL Encrypted" },
                { icon: Clock,     text: "60-second draft" },
                { icon: Check,     text: "Lawyer reviewed templates" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.text}
                    className="flex items-center gap-2 px-3 py-2 bg-background/40 border border-white/5 rounded-lg text-xs text-muted-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {item.text}
                  </div>
                );
              })}
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-yellow-500 text-primary-foreground hover:opacity-95 shadow-gold"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {t("Generate Document with AI", "AI से दस्तावेज़ बनाएँ")}
                <span className="ml-3 px-2 py-0.5 bg-black/20 rounded-md text-xs">
                  ₹{docConfig.price}
                </span>
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                {t(
                  "Free to draft · Pay only to download the final PDF",
                  "ड्राफ्ट मुफ्त · केवल अंतिम PDF डाउनलोड के लिए भुगतान करें"
                )}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
