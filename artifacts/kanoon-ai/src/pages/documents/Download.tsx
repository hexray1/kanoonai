import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Download, Share2, CheckCircle2, FileText, Loader2, Sparkles, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetDocument } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function DownloadDocument() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: doc, isLoading } = useGetDocument(Number(id));
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${BASE}/api/documents/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
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

  // Auto-trigger download on mount
  useEffect(() => {
    if (doc?.paid) handleDownload();
  }, [doc?.paid]);

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
        <Button onClick={() => setLocation("/dashboard")} variant="outline">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Success card */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl mb-6">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
            className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-green-500/30">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h1 className="text-2xl font-black text-white mb-1">Payment Successful!</h1>
            <p className="text-muted-foreground mb-6">Your document has been unlocked and is ready to download.</p>
          </motion.div>

          {/* Document card */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-background border border-white/5 rounded-xl p-4 flex items-center gap-3 mb-6 text-left">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{doc.title}.pdf</p>
              <p className="text-xs text-muted-foreground">A4 · Print-ready · Professional legal format</p>
            </div>
            {downloaded && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
              </motion.div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="space-y-3">
            <Button onClick={handleDownload} disabled={downloading}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-gold">
              {downloading
                ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Preparing PDF…</>
                : <><Download className="mr-2 h-4 w-4" />{downloaded ? "Download Again" : "Download PDF"}</>
              }
            </Button>
            <Button onClick={() => {
              const text = encodeURIComponent(
                `I just created a ${doc.title} using Kanoox AI — India's AI Legal Document Platform in under 60 seconds! Try it at kanooxai.in`
              );
              window.open(`https://wa.me/?text=${text}`, "_blank");
            }} variant="outline"
              className="w-full h-12 border-green-500/30 text-green-400 hover:bg-green-500/10">
              <Share2 className="mr-2 h-5 w-5" />Share on WhatsApp
            </Button>
            <Button onClick={() => setLocation("/dashboard")} variant="ghost"
              className="w-full h-12 text-muted-foreground hover:text-white">
              Open Dashboard →
            </Button>
            <Button onClick={() => setLocation("/documents")} variant="ghost"
              className="w-full h-10 text-muted-foreground/70 text-sm hover:text-muted-foreground">
              <Sparkles className="mr-2 h-4 w-4" />Generate Another Document
            </Button>
          </motion.div>

          <p className="text-xs text-muted-foreground/50 mt-5">
            A copy has been sent to your email · Re-download anytime from Dashboard
          </p>
        </motion.div>

        {/* Review prompt */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="bg-card/50 border border-white/5 rounded-2xl p-5 text-center">
          <p className="text-white font-medium mb-3">How was your experience?</p>
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => toast({ title: "Thanks for the rating!", description: "Your feedback helps us improve." })}>
                <Star className="h-7 w-7 text-primary hover:scale-110 transition-transform fill-primary" />
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Rate your experience · Helps 5,000+ Indians</p>
        </motion.div>
      </div>
    </div>
  );
}
