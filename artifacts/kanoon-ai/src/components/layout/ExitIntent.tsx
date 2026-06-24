import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function ExitIntent() {
  const [show, setShow]       = useState(false);
  const [shown, setShown]     = useState(false);
  const [location, setLocation] = useLocation();

  const trigger = useCallback(() => {
    if (shown) return;
    // Only trigger on pages where there's something to lose
    const relevant = ["/documents/generate/", "/documents/", "/"].some(p =>
      location.startsWith(p)
    );
    if (!relevant) return;
    const key = "exit_intent_shown";
    if (sessionStorage.getItem(key)) return;
    setShow(true);
    setShown(true);
    sessionStorage.setItem(key, "1");
  }, [shown, location]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.clientY <= 8) trigger();
    };
    document.addEventListener("mouseleave", handler);
    return () => document.removeEventListener("mouseleave", handler);
  }, [trigger]);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}>
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative bg-card border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <button onClick={() => setShow(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-white/5">
              <X className="h-5 w-5" />
            </button>

            {/* Warning icon */}
            <div className="flex justify-center mb-5">
              <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white mb-2">
                ⚠️ Ruko! Draft delete ho jayega.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Aapka legal document sirf <span className="text-white font-semibold">₹197</span> mein ready ho sakta hai — warna draft 24 ghante mein permanently delete ho jayega.
              </p>
            </div>

            {/* Savings comparison */}
            <div className="bg-background/60 border border-white/10 rounded-2xl p-4 mb-6 flex justify-between items-center">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Lawyer</p>
                <p className="text-xl font-black text-red-400 line-through">₹5,000</p>
              </div>
              <div className="text-center">
                <div className="h-px w-12 bg-white/10" />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Kanoox AI</p>
                <p className="text-xl font-black text-primary">₹197</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Aap Bachate</p>
                <p className="text-xl font-black text-green-400">₹4,803</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-gold text-base"
                onClick={() => { setShow(false); setLocation("/documents"); }}>
                <FileText className="mr-2 h-5 w-5" />
                Haan, document chahiye mujhe
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <button
                onClick={() => setShow(false)}
                className="w-full text-center text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-2">
                Nahi, draft delete kar do
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
