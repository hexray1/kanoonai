import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, ArrowRight, FileText } from "lucide-react";
import { Link } from "wouter";
import { useLocation } from "wouter";

const HIDE_PATHS = ["/login", "/admin", "/auth/callback", "/documents/generate"];

export function StickyBottomCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [location] = useLocation();

  const shouldHide = HIDE_PATHS.some((p) => location.startsWith(p));

  useEffect(() => {
    if (sessionStorage.getItem("sticky_cta_dismissed")) {
      setDismissed(true);
      return;
    }
    const onScroll = () => {
      if (window.scrollY > 350) setVisible(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("sticky_cta_dismissed", "1");
    setDismissed(true);
  };

  if (dismissed || shouldHide) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0F1E]/95 backdrop-blur-md border-t border-primary/30 shadow-[0_-4px_30px_rgba(234,179,8,0.12)]"
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-semibold whitespace-nowrap">247 docs today</span>
              </div>
              <div className="hidden md:block w-px h-6 bg-white/10 shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">
                  🏡 Rent Agreement · 📄 NDA · ⚖️ Affidavit · 🔔 Legal Notice
                </p>
                <p className="text-muted-foreground text-xs">
                  Free preview always · Pay only to download · From <span className="text-primary font-bold">₹99</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href="/documents">
                <button className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all active:scale-95 whitespace-nowrap">
                  <Zap className="h-4 w-4" />
                  <span className="hidden xs:inline">Generate Now</span>
                  <span className="xs:hidden">Go</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <button
                onClick={dismiss}
                className="p-2 text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-white/5"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
