import { useState, useEffect } from "react";
import { MessageCircle, Phone, Mail, X, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingSupport() {
  const [open, setOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const channels = [
    {
      Icon: MessageCircle,
      label: "WhatsApp",
      sub: "Reply within 5 minutes",
      href: "https://wa.me/918012345678?text=Hi%20A2z%20Kanoon%20AI%2C%20I%20need%20help%20with%20a%20document",
      color: "bg-green-500",
    },
    {
      Icon: Phone,
      label: "Call Support",
      sub: "Mon–Sat, 9 AM – 9 PM",
      href: "tel:+918012345678",
      color: "bg-blue-500",
    },
    {
      Icon: Mail,
      label: "Email Us",
      sub: "support@kanooxai.in",
      href: "mailto:support@kanooxai.in",
      color: "bg-primary",
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {/* Back to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="pointer-events-auto h-10 w-10 rounded-full bg-card border border-white/10 text-white hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-xl flex items-center justify-center transition-all"
            aria-label="Back to top"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto w-72 bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary to-yellow-500 p-4 text-primary-foreground">
              <h3 className="font-bold text-lg">Need help?</h3>
              <p className="text-xs opacity-90">Our team is here to assist you</p>
            </div>
            <div className="p-3 space-y-2">
              {channels.map(({ Icon, label, sub, href, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center text-white shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium group-hover:text-primary transition-colors">{label}</div>
                    <div className="text-xs text-muted-foreground truncate">{sub}</div>
                  </div>
                </a>
              ))}
            </div>
            <div className="border-t border-white/10 px-4 py-2 bg-background/40">
              <p className="text-[10px] text-muted-foreground text-center">
                Avg. response time: <span className="text-green-400">5 min</span> · Online now
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto relative h-14 w-14 rounded-full bg-green-500 text-white shadow-2xl shadow-green-500/30 hover:scale-110 transition-transform flex items-center justify-center"
        aria-label="Open chat support"
      >
        {!open && (
          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30"></span>
        )}
        <span className="relative">
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </span>
        {!open && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-[10px] font-bold rounded-full border-2 border-background flex items-center justify-center text-white">
            1
          </span>
        )}
      </button>
    </div>
  );
}
