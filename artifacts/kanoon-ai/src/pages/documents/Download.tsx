import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, Share2, CheckCircle2, FileText, Loader2, Sparkles,
  Star, ArrowRight, PartyPopper, Trophy, Copy, Check, LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetDocument } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/hooks/use-auth";
import { useAuthStore } from "@/hooks/use-auth";
import { DOCUMENTS } from "@/lib/constants";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Related docs upsell per document type ────────────────────────────────────
const RELATED: Record<string, string[]> = {
  "rent-agreement":    ["legal-notice", "noc-letter", "affidavit"],
  "leave-license":     ["rent-agreement", "legal-notice", "noc-letter"],
  "nda":               ["business-contract", "mou", "offer-letter"],
  "partnership-deed":  ["mou", "business-contract", "nda"],
  "mou":               ["business-contract", "nda", "invoice"],
  "business-contract": ["nda", "mou", "invoice"],
  "affidavit":         ["income-cert", "domicile-cert", "legal-notice"],
  "will":              ["gift-deed", "affidavit", "legal-notice"],
  "legal-notice":      ["fir-draft", "complaint-letter", "affidavit"],
  "offer-letter":      ["emp-contract", "experience-cert", "termination-letter"],
  "emp-contract":      ["offer-letter", "termination-letter", "nda"],
};

// ── Confetti particles ────────────────────────────────────────────────────────
const COLORS = ["#EAB308", "#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];
interface Particle { id: number; x: number; color: string; delay: number; duration: number; size: number; }

function Confetti() {
  const particles: Particle[] = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x:        Math.random() * 100,
    color:    COLORS[Math.floor(Math.random() * COLORS.length)],
    delay:    Math.random() * 0.8,
    duration: 2 + Math.random() * 1.5,
    size:     6 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: 0, rotate: Math.random() > 0.5 ? 360 : -360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "fixed", top: 0, width: p.size, height: p.size,
            backgroundColor: p.color, borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

// ── Referral link copy ────────────────────────────────────────────────────────
function ReferralCopy() {
  const [copied, setCopied] = useState(false);
  const ref_url = "https://kanooxai.in/?ref=user";

  const copy = () => {
    navigator.clipboard.writeText(ref_url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex items-center gap-2 bg-background/60 border border-white/10 rounded-xl p-3">
      <span className="text-xs text-muted-foreground flex-1 truncate font-mono">{ref_url}</span>
      <button onClick={copy}
        className="text-muted-foreground hover:text-white transition-colors p-1 rounded">
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Soft login offer (for guests) ─────────────────────────────────────────────
function SoftLoginOffer({ docId }: { docId: number }) {
  const [, setLocation] = useLocation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
      className="bg-gradient-to-br from-primary/10 to-yellow-500/5 border border-primary/25 rounded-2xl p-5 mb-6 relative">
      <button onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-muted-foreground/50 hover:text-white transition-colors">
        <Check className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 bg-primary/20 rounded-xl shrink-0 border border-primary/30">
          <LogIn className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-white font-bold mb-1">Save your document to Dashboard</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create a free account to access this document anytime, get re-download links, and track your legal documents.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button
          onClick={() => {
            try { sessionStorage.setItem("kanoon_redirect_after_login", `/documents/${docId}/download`); } catch {}
            setLocation("/login");
          }}
          className="flex-1 h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm">
          <LogIn className="mr-2 h-4 w-4" />Sign Up Free
        </Button>
        <Button variant="ghost" onClick={() => setDismissed(true)}
          className="h-10 text-muted-foreground text-sm hover:text-white px-4">
          No thanks
        </Button>
      </div>
    </motion.div>
  );
}

export default function DownloadDocument() {
  const { id }          = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: doc, isLoading } = useGetDocument(Number(id));
  const { token }       = useAuthStore();
  const { toast }       = useToast();
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded]   = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rating, setRating]             = useState(0);
  const autoTriggered = useRef(false);

  const isLoggedIn = !!token;

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      // authFetch automatically includes both auth token (if logged in) and x-guest-token
      const res = await authFetch(`${BASE}/api/documents/${id}/download`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${doc?.title?.replace(/\s+/g, "-") ?? "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
      toast({ title: "Download started! 🎉", description: "Your legal PDF is downloading." });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }, [id, doc?.title]);

  // Auto-trigger on mount + confetti
  useEffect(() => {
    if (doc?.paid && !autoTriggered.current) {
      autoTriggered.current = true;
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
      handleDownload();
    }
  }, [doc?.paid]);

  // Related docs upsell
  const relatedIds   = RELATED[doc?.type ?? ""] ?? Object.keys(DOCUMENTS).filter(k => k !== doc?.type).slice(0, 3);
  const relatedDocs  = relatedIds.slice(0, 3).map(k => ({ id: k, doc: DOCUMENTS[k as keyof typeof DOCUMENTS] })).filter(r => r.doc);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!doc || !doc.paid) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <p className="text-white mb-4">Document not found or payment required.</p>
        <Button onClick={() => setLocation("/documents")} variant="outline">Browse Documents</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      <div className="max-w-2xl mx-auto">

        {/* ── SUCCESS CARD ───────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-green-500/20 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl mb-6">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0" />
          <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none" />

          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
            className="relative w-24 h-24 mx-auto mb-5">
            <div className="w-24 h-24 bg-green-500/10 rounded-full border-2 border-green-500/30 flex items-center justify-center">
              <Trophy className="h-11 w-11 text-green-400" />
            </div>
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }}
              className="absolute -top-1 -right-1">
              <PartyPopper className="h-6 w-6 text-primary" />
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="text-3xl font-black text-white mb-2">Payment Successful! 🎉</h1>
            <p className="text-muted-foreground mb-2">
              Your <span className="text-white font-semibold">{doc.title}</span> is ready to download.
            </p>
            <p className="text-xs text-muted-foreground/60 mb-6">
              Valid across all Indian states · Lawyer-reviewed format
            </p>
          </motion.div>

          {/* Document file row */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-background/60 border border-white/10 rounded-xl p-4 flex items-center gap-3 mb-6 text-left">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{doc.title}.pdf</p>
              <p className="text-xs text-muted-foreground">A4 · Print-ready · Stamp paper format</p>
            </div>
            {downloaded && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
              </motion.div>
            )}
          </motion.div>

          {/* Action buttons */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="space-y-3">
            <Button onClick={handleDownload} disabled={downloading}
              className="w-full h-13 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-gold text-base">
              {downloading
                ? <><Loader2 className="animate-spin mr-2 h-5 w-5" />Preparing PDF…</>
                : <><Download className="mr-2 h-5 w-5" />{downloaded ? "Download Again" : "Download PDF"}</>}
            </Button>

            <Button onClick={() => {
              const text = encodeURIComponent(
                `Just created my ${doc.title} using A2z Kanoon AI in under 60 seconds! No lawyer needed 🚀 Try it free: kanooxai.in`
              );
              window.open(`https://wa.me/?text=${text}`, "_blank");
            }} variant="outline"
              className="w-full h-11 border-green-500/30 text-green-400 hover:bg-green-500/10">
              <Share2 className="mr-2 h-5 w-5" />Share on WhatsApp
            </Button>

            <div className="flex gap-3">
              {isLoggedIn ? (
                <Button onClick={() => setLocation("/dashboard")} variant="ghost"
                  className="flex-1 h-10 text-muted-foreground hover:text-white">
                  Dashboard
                </Button>
              ) : (
                <Button onClick={() => setLocation("/documents")} variant="ghost"
                  className="flex-1 h-10 text-muted-foreground hover:text-white">
                  Browse Docs
                </Button>
              )}
              <Button onClick={() => setLocation("/documents")} variant="ghost"
                className="flex-1 h-10 text-muted-foreground hover:text-white">
                <Sparkles className="mr-1.5 h-4 w-4" />More Docs
              </Button>
            </div>
          </motion.div>
        </motion.div>

        {/* ── SOFT LOGIN OFFER (guests only) ──────────────── */}
        {!isLoggedIn && <SoftLoginOffer docId={Number(id)} />}

        {/* ── RATING ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="bg-card/60 border border-white/5 rounded-2xl p-5 text-center mb-6">
          <p className="text-white font-semibold mb-3 flex items-center justify-center gap-2">
            <Star className="h-5 w-5 text-primary fill-primary" />
            How was your experience?
          </p>
          <div className="flex items-center justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => {
                setRating(n);
                toast({ title: `${n === 5 ? "Amazing!" : "Thanks!"} ⭐`.trim(), description: "Your feedback helps us improve for everyone." });
              }}>
                <Star className={`h-8 w-8 transition-all hover:scale-125 ${n <= rating ? "text-primary fill-primary" : "text-muted-foreground/30 hover:text-primary"}`} />
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">12,000+ users rated us 4.9 ⭐ on average</p>
        </motion.div>

        {/* ── REFERRAL ───────────────────────────────────── */}
        {isLoggedIn && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-primary/20 rounded-xl shrink-0">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-white font-bold mb-0.5">Earn ₹50 per referral 💰</p>
                <p className="text-xs text-muted-foreground">Share your link — get ₹50 credit for every friend who creates a document.</p>
              </div>
            </div>
            <ReferralCopy />
          </motion.div>
        )}

        {/* ── RELATED DOCUMENTS UPSELL ───────────────────── */}
        {relatedDocs.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
            <p className="text-white font-bold mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              You may also need
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedDocs.map(({ id: relId, doc: relDoc }) => (
                <Link key={relId} href={`/documents/generate/${relId}`}>
                  <div className="bg-card border border-white/5 hover:border-primary/30 rounded-xl p-4 cursor-pointer transition-all hover:shadow-gold group">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors line-clamp-1">
                        {relDoc.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold text-sm">₹{relDoc.price}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        Generate <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
