import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X } from "lucide-react";

const EVENTS = [
  { name: "Priya S.",     city: "Mumbai",    doc: "Rent Agreement",     time: 12 },
  { name: "Rajesh K.",    city: "Delhi",     doc: "NDA Agreement",      time: 8 },
  { name: "Anita M.",     city: "Bangalore", doc: "Partnership Deed",   time: 19 },
  { name: "Vikram T.",    city: "Pune",      doc: "Legal Notice",       time: 5 },
  { name: "Sunita D.",    city: "Hyderabad", doc: "Affidavit",          time: 31 },
  { name: "Mohit G.",     city: "Chennai",   doc: "Offer Letter",       time: 14 },
  { name: "Meena P.",     city: "Kolkata",   doc: "Gift Deed",          time: 7 },
  { name: "Arjun B.",     city: "Jaipur",    doc: "Employment Contract", time: 22 },
  { name: "Kavita R.",    city: "Lucknow",   doc: "Will / Testament",   time: 43 },
  { name: "Deepak N.",    city: "Surat",     doc: "FIR Draft",          time: 6 },
  { name: "Shweta S.",    city: "Chandigarh",doc: "RTI Application",    time: 18 },
  { name: "Amit V.",      city: "Nagpur",    doc: "MOU Agreement",      time: 9 },
  { name: "Rekha J.",     city: "Ahmedabad", doc: "Complaint Letter",   time: 27 },
  { name: "Suresh C.",    city: "Bhopal",    doc: "Income Certificate App", time: 15 },
  { name: "Pooja L.",     city: "Indore",    doc: "Leave & License",    time: 3 },
];

interface Event { name: string; city: string; doc: string; time: number; }

function fmt(mins: number): string {
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
}

export function LiveActivityToast() {
  const [visible, setVisible]   = useState(false);
  const [current, setCurrent]   = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [idx, setIdx]           = useState(0);

  const show = useCallback((ev: Event) => {
    setCurrent(ev);
    setVisible(true);
    setTimeout(() => setVisible(false), 5000);
  }, []);

  useEffect(() => {
    // Show first notification quickly to establish social proof
    const init = setTimeout(() => {
      show(EVENTS[0]);
    }, 4000);
    return () => clearTimeout(init);
  }, []);

  useEffect(() => {
    if (dismissed) return;
    // Cycle every 14-20 seconds — frequent enough to feel live
    const interval = setInterval(() => {
      setIdx(i => {
        const next = (i + 1) % EVENTS.length;
        show(EVENTS[next]);
        return next;
      });
    }, 14000 + Math.random() * 6000);
    return () => clearInterval(interval);
  }, [dismissed, show]);

  if (dismissed || !current) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-24 left-4 z-[100] max-w-xs"
        >
          <div className="bg-card border border-white/15 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold leading-tight">
                {current.name} from {current.city}
              </p>
              <p className="text-muted-foreground text-[11px] leading-tight truncate">
                Created <span className="text-primary">{current.doc}</span>
              </p>
              <p className="text-muted-foreground/50 text-[10px]">{fmt(current.time)}</p>
            </div>
            <button
              onClick={() => { setVisible(false); setDismissed(true); }}
              className="text-muted-foreground/40 hover:text-muted-foreground p-1 shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
