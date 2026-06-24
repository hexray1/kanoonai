import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X } from "lucide-react";

function getCountdownToMidnight(): number {
  const now  = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

function fmt(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const MESSAGES = [
  "⚡ Today only: All documents from ₹97 · Price increases at midnight",
  "🔥 12,000+ Indians trust Kanoox AI · Rated 4.9★ from 1,247 reviews",
  "💸 Save up to ₹49,000 vs lawyer fees · NVIDIA AI drafts in 60 seconds",
  "🇮🇳 Available in Hindi, Marathi, Tamil, Telugu + English · 28 states",
  "⏳ Limited time: 97 ₹ flat for any document · Ends at midnight tonight",
];

export function UrgencyBar() {
  const [secs, setSecs]         = useState(getCountdownToMidnight());
  const [msgIdx, setMsgIdx]     = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("urgency_bar_dismissed");
    if (dismissed) setDismissed(true);
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const t = setInterval(() => setSecs(getCountdownToMidnight()), 1000);
    return () => clearInterval(t);
  }, [dismissed]);

  useEffect(() => {
    if (dismissed) return;
    const t = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 4000);
    return () => clearInterval(t);
  }, [dismissed]);

  const dismiss = () => {
    sessionStorage.setItem("urgency_bar_dismissed", "1");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary via-yellow-400 to-primary text-black text-center py-2 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 z-50">
      <AnimatePresence mode="wait">
        <motion.span key={msgIdx}
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2">
          {MESSAGES[msgIdx]}
        </motion.span>
      </AnimatePresence>

      <span className="hidden sm:inline-flex items-center gap-1 bg-black/15 rounded-full px-3 py-0.5 font-mono font-black ml-2">
        <Zap className="h-3 w-3" />
        {fmt(secs)}
      </span>

      <button onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded-full transition-colors"
        aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
