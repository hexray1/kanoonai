import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Shield, Zap, FileText, CheckCircle2, ArrowRight, XCircle,
  Bot, Download, Users, Award, Lock, Sparkles,
  Clock, Check, TrendingUp, ChevronDown, Globe, Cpu,
  MessageCircle, BadgeCheck, IndianRupee, Scale, Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

// ── Animated Counter ───────────────────────────────────────────────────────
function Counter({ to, suffix = "", prefix = "", duration = 2 }: {
  to: number; suffix?: string; prefix?: string; duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let s = 0;
    const step = 1000 / 60;
    const steps = (duration * 1000) / step;
    const inc = to / steps;
    const id = setInterval(() => {
      s += inc;
      if (s >= to) { setVal(to); clearInterval(id); }
      else setVal(Math.floor(s));
    }, step);
    return () => clearInterval(id);
  }, [inView, to, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString("en-IN")}{suffix}</span>;
}

// ── Animated Document Typing Preview ──────────────────────────────────────
const DOC_PREVIEWS = [
  {
    type: "RENT AGREEMENT",
    color: "#4A90D9",
    lines: [
      "THIS DEED OF RENT AGREEMENT is made on this 22nd",
      "day of May, 2026 at Mumbai, Maharashtra.",
      "",
      "BETWEEN",
      "",
      "Rajesh Kumar Sharma, S/o Late Mohan Sharma,",
      "residing at 14B, Worli Sea Face, Mumbai - 400018",
      "(hereinafter referred to as the \"LANDLORD\")",
      "",
      "AND",
      "",
      "Priya Patel, D/o Suresh Patel, residing at",
      "42, Koregaon Park, Pune - 411001",
      "(hereinafter referred to as the \"TENANT\")",
      "",
      "1. TERM OF TENANCY",
      "1.1 The Landlord hereby lets out the premises",
      "    for a period of 11 (Eleven) months commencing",
      "    from 01st June, 2026 to 30th April, 2027.",
      "",
      "2. RENT AND DEPOSIT",
      "2.1 Monthly Rent: ₹35,000/- (Rupees Thirty-Five",
      "    Thousand Only) payable by the 5th of each month.",
      "2.2 Security Deposit: ₹1,05,000/- (Rupees One Lakh",
      "    Five Thousand Only) — refundable on vacation.",
    ],
  },
  {
    type: "NON-DISCLOSURE AGREEMENT",
    color: "#9B59B6",
    lines: [
      "NON-DISCLOSURE AGREEMENT",
      "",
      "This Agreement is entered into as of 22nd May, 2026",
      "between the following parties:",
      "",
      "DISCLOSING PARTY:",
      "TechVentures Pvt. Ltd., CIN: U72900MH2021PTC123456",
      "Registered at: 501, Raheja Towers, BKC, Mumbai",
      "",
      "RECEIVING PARTY:",
      "DataSoft Solutions LLP, LLPIN: AAB-1234",
      "Registered at: 201, HSR Layout, Bengaluru",
      "",
      "1. CONFIDENTIAL INFORMATION",
      "   Means any non-public information disclosed by",
      "   the Disclosing Party including but not limited",
      "   to: technical data, trade secrets, business",
      "   plans, financial projections, source code,",
      "   customer lists, and pricing information.",
      "",
      "2. OBLIGATIONS",
      "2.1 The Receiving Party shall hold the Confidential",
      "    Information in strict confidence and shall not",
      "    disclose, copy, or use such information for",
      "    any purpose other than the Permitted Purpose.",
    ],
  },
  {
    type: "LEGAL NOTICE",
    color: "#E67E22",
    lines: [
      "ADVOCATE VIKRAM SINGH & ASSOCIATES",
      "Enrollment No. DL/2015/1234 | Bar Council of Delhi",
      "23, Lawyers' Chambers, Patiala House Courts, New Delhi",
      "",
      "Date: 22nd May, 2026   Ref: VS/LN/2026/0847",
      "",
      "BY REGISTERED POST A.D.",
      "",
      "TO,",
      "Mr. Rohit Agarwal,",
      "456, DLF Phase II, Gurugram, Haryana - 122002",
      "",
      "SUBJECT: LEGAL NOTICE UNDER SECTION 138 OF THE",
      "NEGOTIABLE INSTRUMENTS ACT, 1881",
      "",
      "Under the instructions from and on behalf of",
      "my client, M/s Global Tech Solutions, I hereby",
      "serve upon you the following Legal Notice:",
      "",
      "1. That my client entered into a services agreement",
      "   dated 01st March, 2026 with you for provision",
      "   of software development services worth",
      "   ₹8,50,000/- (Rupees Eight Lakhs Fifty Thousand).",
    ],
  },
];

function DocumentTypingPreview() {
  const [docIdx, setDocIdx] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");
  const [stage, setStage] = useState<"typing" | "pause" | "fading">("typing");
  const containerRef = useRef<HTMLDivElement>(null);

  const doc = DOC_PREVIEWS[docIdx];
  const TYPING_SPEED = 28;

  useEffect(() => {
    // Reset when doc changes
    setLineIdx(0); setCharIdx(0); setDisplayedLines([]); setCurrentLine(""); setStage("typing");
  }, [docIdx]);

  useEffect(() => {
    if (stage === "pause") {
      const t = setTimeout(() => { setStage("fading"); }, 2200);
      return () => clearTimeout(t);
    }
    if (stage === "fading") {
      const t = setTimeout(() => {
        setDocIdx((i) => (i + 1) % DOC_PREVIEWS.length);
      }, 700);
      return () => clearTimeout(t);
    }
    if (stage !== "typing") return;

    const lines = doc.lines;
    if (lineIdx >= lines.length) { setStage("pause"); return; }
    const line = lines[lineIdx];

    if (charIdx < line.length) {
      const t = setTimeout(() => {
        setCurrentLine(line.slice(0, charIdx + 1));
        setCharIdx(c => c + 1);
      }, line === "" ? 1 : TYPING_SPEED);
      return () => clearTimeout(t);
    } else {
      // Line complete — move to next
      const t = setTimeout(() => {
        setDisplayedLines(prev => [...prev, line]);
        setCurrentLine("");
        setLineIdx(l => l + 1);
        setCharIdx(0);
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, line === "" ? 10 : 60);
      return () => clearTimeout(t);
    }
  }, [stage, lineIdx, charIdx, doc]);

  return (
    <div className={`relative rounded-2xl border overflow-hidden shadow-2xl transition-opacity duration-700 ${stage === "fading" ? "opacity-0" : "opacity-100"}`}
      style={{ borderColor: `${doc.color}30`, background: "#0D1117" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${doc.color}20`, background: `${doc.color}08` }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs font-mono ml-2" style={{ color: `${doc.color}` }}>{doc.type}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-medium">AI drafting…</span>
        </div>
      </div>

      {/* Document content */}
      <div ref={containerRef} className="p-5 h-[280px] overflow-hidden font-mono text-[11px] leading-[1.7]">
        {displayedLines.map((line, i) => (
          <div key={i} className={line === "" ? "h-3" : "text-gray-300 whitespace-pre"}>{line}</div>
        ))}
        {stage === "typing" && (
          <div className="text-gray-200 whitespace-pre">
            {currentLine}
            <span className="inline-block w-[6px] h-[13px] ml-px animate-pulse align-middle" style={{ background: doc.color }} />
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t text-[10px]" style={{ borderColor: `${doc.color}15`, background: `${doc.color}05` }}>
        <span className="font-mono" style={{ color: `${doc.color}99` }}>
          {displayedLines.length}/{doc.lines.length} lines · {displayedLines.join(" ").split(/\s+/).filter(Boolean).length} words
        </span>
        <span className="text-gray-600 flex items-center gap-1">
          <Zap className="h-2.5 w-2.5" />AI drafting
        </span>
      </div>
    </div>
  );
}

// ── Live Activity Ticker ───────────────────────────────────────────────────
const ACTIVITY = [
  "🏡 Ravi from Mumbai created a Rent Agreement",
  "📄 Priya from Delhi drafted an NDA",
  "⚖️ Anand from Bengaluru filed an RTI Application",
  "📋 Sneha from Hyderabad generated an Offer Letter",
  "🤝 Raj from Pune created a Partnership Deed",
  "📝 Meena from Chennai drafted an Affidavit",
  "🔔 Vikram from Ahmedabad sent a Legal Notice",
  "📜 Nisha from Kolkata created a Gift Deed",
  "💼 Arjun from Jaipur drafted an Employment Contract",
  "🏛️ Deepa from Kochi filed a Consumer Complaint",
];
function LiveTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ACTIVITY.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm overflow-hidden">
      <span className="flex items-center gap-1.5 shrink-0">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-green-400 font-medium text-xs uppercase tracking-wide">Live</span>
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-white/80 truncate max-w-[280px] sm:max-w-none"
        >
          {ACTIVITY[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────
const STATS = [
  { value: 25,  suffix: "+", label: "Legal Document Types", icon: FileText },
  { value: 5,   suffix: "",  label: "Indian Languages",      icon: Users },
  { value: 28,  suffix: "",  label: "States & UTs Covered",  icon: Globe },
  { value: 60,  suffix: "s", label: "Avg. Generation Time",  icon: Zap },
];

const STEPS = [
  { icon: FileText, step: "01", title: "Pick Your Document",
    desc: "Choose from 25+ Indian legal templates — rent agreements, NDAs, affidavits, wills, legal notices and more." },
  { icon: Bot,      step: "02", title: "Fill a Simple Form",
    desc: "Answer plain-language questions. No legal jargon. Our AI handles all the legal drafting for you." },
  { icon: Download, step: "03", title: "Download Your PDF",
    desc: "Get a complete, print-ready PDF in 60 seconds — ready for stamp paper, signing, notarization, or registration." },
];

const DOCUMENT_CATEGORIES = [
  {
    icon: "🏡", title: "Rental & Housing", color: "from-blue-500/10 to-blue-600/5",
    border: "border-blue-500/20", docs: [
      { name: "Rent Agreement",       slug: "rent-agreement",  price: 199 },
      { name: "Leave & License",      slug: "leave-license",   price: 199 },
      { name: "NOC Letter",           slug: "noc-letter",      price: 99  },
      { name: "Eviction Notice",      slug: "eviction-notice", price: 99  },
    ],
  },
  {
    icon: "💼", title: "Business & Finance", color: "from-purple-500/10 to-purple-600/5",
    border: "border-purple-500/20", docs: [
      { name: "Partnership Deed",  slug: "partnership-deed",   price: 499 },
      { name: "MOU",               slug: "mou",                price: 499 },
      { name: "NDA",               slug: "nda",                price: 299 },
      { name: "Business Contract", slug: "business-contract",  price: 499 },
    ],
  },
  {
    icon: "👨‍👩‍👧", title: "Personal & Family", color: "from-rose-500/10 to-rose-600/5",
    border: "border-rose-500/20", docs: [
      { name: "Affidavit",         slug: "affidavit",         price: 199 },
      { name: "Gift Deed",         slug: "gift-deed",         price: 499 },
      { name: "Will & Testament",  slug: "will",              price: 499 },
      { name: "Divorce Petition",  slug: "divorce-petition",  price: 499 },
    ],
  },
  {
    icon: "⚖️", title: "Legal Notices", color: "from-amber-500/10 to-amber-600/5",
    border: "border-amber-500/20", docs: [
      { name: "Legal Notice",    slug: "legal-notice",    price: 299 },
      { name: "FIR Draft",       slug: "fir-draft",       price: 199 },
      { name: "RTI Application", slug: "rti",             price: 99  },
      { name: "Complaint Letter",slug: "complaint-letter",price: 99  },
    ],
  },
  {
    icon: "💼", title: "Employment", color: "from-teal-500/10 to-teal-600/5",
    border: "border-teal-500/20", docs: [
      { name: "Offer Letter",        slug: "offer-letter",       price: 99  },
      { name: "Employment Contract", slug: "emp-contract",       price: 199 },
      { name: "Experience Cert.",    slug: "experience-cert",    price: 99  },
      { name: "Termination Letter",  slug: "termination-letter", price: 99  },
    ],
  },
  {
    icon: "🏛️", title: "Government Docs", color: "from-green-500/10 to-green-600/5",
    border: "border-green-500/20", docs: [
      { name: "Income Certificate",  slug: "income-cert",   price: 99 },
      { name: "Caste Certificate",   slug: "caste-cert",    price: 99 },
      { name: "Domicile Certificate",slug: "domicile-cert", price: 99 },
      { name: "Ration Card App.",    slug: "ration-card",   price: 99 },
    ],
  },
];

const LAWYER_COSTS: Record<string, { lawyer: number; name: string }> = {
  "Rent Agreement":       { lawyer: 3000,  name: "rent-agreement"   },
  "NDA":                  { lawyer: 8000,  name: "nda"               },
  "Partnership Deed":     { lawyer: 15000, name: "partnership-deed"  },
  "Affidavit":            { lawyer: 2000,  name: "affidavit"         },
  "Legal Notice":         { lawyer: 5000,  name: "legal-notice"      },
  "Will & Testament":     { lawyer: 12000, name: "will"              },
  "Employment Contract":  { lawyer: 7000,  name: "emp-contract"      },
  "Gift Deed":            { lawyer: 10000, name: "gift-deed"         },
};
const KANOOX_COSTS: Record<string, number> = {
  "Rent Agreement": 199, "NDA": 299, "Partnership Deed": 499,
  "Affidavit": 199, "Legal Notice": 299, "Will & Testament": 499,
  "Employment Contract": 299, "Gift Deed": 499,
};

const COMPARISON = [
  { feature: "Cost",              kanoox: "₹99 – ₹499",     lawyer: "₹3,000 – ₹50,000", others: "₹500 – ₹2,000" },
  { feature: "Time to get doc",   kanoox: "60 seconds",      lawyer: "2 – 7 days",        others: "1 – 3 days"    },
  { feature: "India-specific law",kanoox: true,              lawyer: true,                 others: false           },
  { feature: "5 Indian languages",kanoox: true,              lawyer: false,                others: false           },
  { feature: "Available 24/7",    kanoox: true,              lawyer: false,                others: true            },
  { feature: "Live AI drafting",  kanoox: true,              lawyer: false,                others: false           },
  { feature: "Free preview",      kanoox: true,              lawyer: false,                others: false           },
  { feature: "7-day free edits", kanoox: true,              lawyer: false,                others: "Partial"       },
  { feature: "AI powered",       kanoox: true,              lawyer: false,                others: false           },
];

const HOME_FAQS = [
  { q: "Are these documents legally valid in India?",
    a: "Kanoon AI generates structured legal drafts aligned with current Indian statutes — the Indian Contract Act, Transfer of Property Act, Indian Partnership Act, and the Bharatiya Sakshya Adhiniyam, 2023 — with witness sections, stamp duty advisories, and jurisdiction clauses. A draft becomes legally effective only when properly executed: signed, stamped as per your state's Stamp Act, and registered where the law requires it (e.g. gift deeds, leases over 11 months). For high-stakes matters, have an advocate review the final document before use." },
  { q: "Do I need to pay before I can see my document?",
    a: "Never. Kanoon AI lets you draft and preview the complete document for free. You pay only when you're satisfied and ready to download the final PDF. No hidden charges." },
  { q: "How long does it take to get my document?",
    a: "Under 60 seconds for most documents. You watch the AI write it in real-time, word by word. Complex documents like Partnership Deeds or Wills may take up to 90 seconds." },
  { q: "Which states and languages are supported?",
    a: "All 28 states and 8 UTs of India. 5 languages: English, Hindi, Marathi, Tamil, Telugu. State-specific laws are applied automatically — e.g., Maharashtra Rent Control Act for Leave & License agreements." },
];

function HomeFaqItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left bg-card hover:bg-white/5 transition-colors">
        <span className="text-white font-medium pr-4">{q}</span>
        <ChevronDown className={`h-5 w-5 text-primary shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="a" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-5 pb-5 pt-2 text-muted-foreground text-sm leading-relaxed border-t border-white/5">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CellVal({ val }: { val: boolean | string }) {
  if (val === true)  return <CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" />;
  if (val === false) return <XCircle className="h-5 w-5 text-red-400/60 mx-auto" />;
  return <span className="text-muted-foreground text-xs">{val}</span>;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Home() {
  const { t } = useLanguage();
  const [calcDoc, setCalcDoc] = useState("Rent Agreement");

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  const lawyerCost = LAWYER_COSTS[calcDoc]?.lawyer ?? 5000;
  const kanooxCost = KANOOX_COSTS[calcDoc] ?? 299;
  const savings = lawyerCost - kanooxCost;
  const savingsPct = Math.round((savings / lawyerCost) * 100);

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} alt="India legal document AI"
            className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
        </div>
        <div className="absolute top-0 left-0 w-[600px] h-[500px] bg-primary/8 rounded-full blur-[140px] pointer-events-none -translate-x-1/4" />
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-blue-500/6 rounded-full blur-[120px] pointer-events-none translate-x-1/4" />

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[580px]">

            {/* Left column — text */}
            <div className="text-left max-w-xl">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                className="mb-6">
                <LiveTicker />
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-5 leading-[1.06]">
                India's AI<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-300 to-primary">
                  Legal Document
                </span>
                <br />Generator
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.16 }}
                className="text-base md:text-lg text-muted-foreground mb-3 leading-relaxed">
                {t(
                  "Rent agreements, NDAs, affidavits, wills & 22 more legal documents — drafted live by AI in 60 seconds. India-specific. From ₹99.",
                  "NVIDIA AI से 25+ भारतीय कानूनी दस्तावेज़ 60 सेकंड में। किराया अनुबंध, NDA, हलफनामे, वसीयत। सिर्फ ₹99 से।"
                )}
              </motion.p>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}
                className="text-sm text-primary font-semibold mb-8">
                ✦ Free to draft & preview · Pay only to download PDF ✦
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/documents" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full text-base h-13 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold group font-bold">
                    {t("Create Document Now", "अभी दस्तावेज़ बनाएँ")}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <div className="w-full sm:w-auto"><Button size="lg" variant="outline"
                  className="w-full text-base h-13 px-6 border-white/20 text-white hover:bg-white/5"
                  onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
                  {t("See Pricing", "मूल्य देखें")}
                </Button></div>
              </motion.div>

              {/* Quick doc links */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}
                className="mb-8">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Popular right now →</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "Rent Agreement", slug: "rent-agreement", price: "₹199" },
                    { name: "NDA",            slug: "nda",            price: "₹299" },
                    { name: "Legal Notice",   slug: "legal-notice",   price: "₹299" },
                    { name: "Affidavit",      slug: "affidavit",      price: "₹199" },
                  ].map(({ name, slug, price }) => (
                    <Link key={slug} href={`/documents/generate/${slug}`}>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-primary/40 hover:bg-primary/5 text-xs font-medium transition-all cursor-pointer">
                        {name} <span className="text-primary font-bold">{price}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Trust badges */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground/70">
                {[
                  { icon: Lock,       text: "SSL Encrypted"        },
                  { icon: Shield,     text: "Razorpay Secured"      },
                  { icon: Award,      text: "Lawyer-Reviewed"       },
                  { icon: Cpu,        text: "AI document engine"    },
                  { icon: BadgeCheck, text: "DPDPA 2023 Compliant"  },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1">
                    <Icon className="h-3 w-3 text-primary/70 shrink-0" />
                    {text}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right column — animated document preview */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.2 }}
              className="hidden lg:block">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl" />
                <div className="relative">
                  <DocumentTypingPreview />
                  {/* Floating badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                    className="absolute -bottom-4 -left-6 bg-card border border-green-500/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl">
                    <div className="h-9 w-9 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">Document Ready</p>
                      <p className="text-[10px] text-muted-foreground">42 sec · AI</p>
                    </div>
                  </motion.div>
                  {/* Floating users badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0, duration: 0.4 }}
                    className="absolute -top-4 -right-5 bg-card border border-primary/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl">
                    <div className="flex -space-x-2">
                      {["R", "P", "A", "V"].map((l, i) => (
                        <div key={i} className="h-7 w-7 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary">{l}</div>
                      ))}
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">25+ document types</p>
                      <p className="text-[10px] text-muted-foreground">5 Indian languages</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-white/5 bg-card/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center group">
                  <div className="flex justify-center mb-2">
                    <Icon className="h-5 w-5 text-primary/50 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary to-yellow-200 mb-1">
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRESS / MEDIA STRIP ─────────────────────────────────────────── */}
      <section className="py-10 border-b border-white/5 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground/50 uppercase tracking-widest font-semibold mb-6">
            How Kanoon AI works for you
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              "No account needed", "Pay per document", "Free draft & preview",
              "7-day free edits", "UPI · Cards · Netbanking",
            ].map((pub) => (
              <span key={pub} className="text-sm font-bold text-white/20 hover:text-white/40 transition-colors tracking-wide uppercase cursor-default select-none">
                {pub}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN / AGITATION ────────────────────────────────────────────── */}
      <section className="py-20 bg-card/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold tracking-wider uppercase mb-4 border border-red-500/20">
              The Problem
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Why are Indians still overpaying for basic legal documents?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The traditional legal system is broken for everyday Indians. Kanoon AI fixes it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Old Way */}
            <div className="p-7 rounded-2xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-red-500/15 flex items-center justify-center text-lg">❌</div>
                <h3 className="text-white font-bold text-lg">The Old Way — Traditional Lawyer</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "⏳", text: "2–7 days waiting time just for a draft" },
                  { icon: "💸", text: "₹3,000–₹50,000 per document in fees" },
                  { icon: "📅", text: "Office appointments, lunch breaks wasted" },
                  { icon: "🗣️", text: "Legal jargon you don't understand" },
                  { icon: "🌐", text: "Only available in English, no regional languages" },
                  { icon: "😤", text: "3 revisions? That's another ₹5,000" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="text-base leading-none mt-0.5">{icon}</span>
                    <span className="text-red-300/80 text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kanoon Way */}
            <div className="p-7 rounded-2xl bg-green-500/5 border border-green-500/20 relative">
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                Smart Choice
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-green-500/15 flex items-center justify-center text-lg">✅</div>
                <h3 className="text-white font-bold text-lg">The Kanoon Way — AI in 60 Seconds</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "⚡", text: "Complete document in under 60 seconds" },
                  { icon: "💰", text: "₹99–₹499 flat. No hidden charges" },
                  { icon: "🏠", text: "Works from your phone, anytime, 24×7" },
                  { icon: "🇮🇳", text: "Plain language questions, India-specific law" },
                  { icon: "🗣️", text: "Hindi, Marathi, Tamil, Telugu + English" },
                  { icon: "🔄", text: "Free edits within 7 days, always" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="text-base leading-none mt-0.5">{icon}</span>
                    <span className="text-green-200/80 text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/documents">
              <button className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:bg-primary/90 shadow-[0_0_30px_rgba(234,179,8,0.25)] transition-all active:scale-95">
                <Zap className="h-5 w-5" />
                Start Smart — Generate Free
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase mb-4">
              How It Works
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Your legal document in 3 steps
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No legal jargon. No lawyer appointments. No waiting. Just fill a form, watch AI draft it live, and download.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px border-t-2 border-dashed border-primary/20 z-0" />
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.title}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative z-10 text-center">
                  <div className="relative mx-auto w-24 h-24 mb-6">
                    <div className="absolute inset-0 bg-primary/10 rounded-2xl rotate-45" />
                    <div className="absolute inset-2 bg-card rounded-xl border border-primary/30 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-black flex items-center justify-center shadow-gold">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ALL 25 DOCUMENT CATEGORIES ───────────────────────────────────── */}
      <section className="py-24 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase mb-4">
              25+ Templates
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Every Indian legal document you'll ever need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From rental agreements to government certificates — drafted in compliance with Indian law in under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {DOCUMENT_CATEGORIES.map((cat, ci) => (
              <motion.div key={cat.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: ci * 0.07 }}
                className={`p-6 rounded-2xl bg-gradient-to-br ${cat.color} border ${cat.border} hover:scale-[1.02] transition-transform`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{cat.icon}</span>
                  <h3 className="text-white font-bold">{cat.title}</h3>
                </div>
                <div className="space-y-2">
                  {cat.docs.map((doc) => (
                    <Link key={doc.slug} href={`/documents/generate/${doc.slug}`}>
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <ChevronDown className="h-3.5 w-3.5 text-primary -rotate-90 shrink-0" />
                          <span className="text-white/80 group-hover:text-white text-sm transition-colors">
                            {doc.name}
                          </span>
                        </div>
                        <span className="text-primary text-xs font-bold">₹{doc.price}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/documents">
              <Button variant="outline" size="lg" className="border-primary/30 text-primary hover:bg-primary/10">
                Browse All 25+ Templates <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SAVINGS CALCULATOR ───────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase mb-4">
              Savings Calculator
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              See how much you save
            </h2>
            <p className="text-muted-foreground">
              Compare Kanoon AI vs hiring a traditional lawyer in India.
            </p>
          </div>

          <div className="bg-card border border-white/10 rounded-3xl p-8 sm:p-12">
            <div className="mb-8">
              <label className="text-white font-medium mb-3 block">Select a document type:</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(LAWYER_COSTS).map((doc) => (
                  <button key={doc} onClick={() => setCalcDoc(doc)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      calcDoc === doc
                        ? "bg-primary text-primary-foreground shadow-gold"
                        : "bg-background border border-white/10 text-muted-foreground hover:text-white hover:border-white/30"
                    }`}>
                    {doc}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">Traditional Lawyer</p>
                <p className="text-4xl font-black text-white mb-1">
                  ₹{lawyerCost.toLocaleString("en-IN")}+
                </p>
                <p className="text-muted-foreground text-xs">+ 2–7 days wait</p>
              </div>

              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 border-2 border-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <IndianRupee className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-primary font-black text-lg">Save</p>
                  <motion.p key={savings} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    className="text-3xl font-black text-primary">
                    {savingsPct}%
                  </motion.p>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center shadow-gold">
                <p className="text-primary text-xs font-bold uppercase tracking-wider mb-2">Kanoon AI</p>
                <p className="text-4xl font-black text-white mb-1">
                  ₹{kanooxCost}
                </p>
                <p className="text-muted-foreground text-xs">Ready in 60 seconds</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-2xl font-black text-white mb-1">
                You save <span className="text-primary">₹{savings.toLocaleString("en-IN")}+</span> on a {calcDoc}
              </p>
              <p className="text-muted-foreground text-sm">Free preview · Pay only to download</p>
              <Link href={`/documents/generate/${LAWYER_COSTS[calcDoc]?.name}`}>
                <Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold h-12 px-8">
                  Generate {calcDoc} Now — ₹{kanooxCost}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────── */}
      <section className="py-24 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase mb-4">
              Why Kanoon AI?
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Kanoon AI vs the alternatives
            </h2>
            <p className="text-muted-foreground">No contest. See for yourself.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-muted-foreground font-medium">Feature</th>
                  <th className="p-4 text-center bg-primary/10 border-x border-primary/20">
                    <span className="text-primary font-bold">Kanoon AI</span>
                    <div className="text-[10px] text-primary/60 mt-0.5">Recommended</div>
                  </th>
                  <th className="p-4 text-center text-muted-foreground font-medium">Traditional Lawyer</th>
                  <th className="p-4 text-center text-muted-foreground font-medium">Other Tools</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                    <td className="p-4 text-white/80 font-medium">{row.feature}</td>
                    <td className="p-4 text-center bg-primary/5 border-x border-primary/10">
                      {typeof row.kanoox === "string"
                        ? <span className="text-primary font-bold">{row.kanoox}</span>
                        : <CellVal val={row.kanoox} />}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.lawyer === "string"
                        ? <span className="text-white/60">{row.lawyer}</span>
                        : <CellVal val={row.lawyer} />}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.others === "string"
                        ? <span className="text-white/60">{row.others}</span>
                        : <CellVal val={row.others} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-8">
            <Link href="/documents">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold h-12 px-8">
                Try Kanoon AI Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI ENGINE ──────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#76b900]/10 border border-[#76b900]/30 text-[#76b900] text-xs font-semibold mb-6">
                <Cpu className="h-3.5 w-3.5" /> Powered by AI
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
                World's most powerful AI writes your legal documents
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Kanoon AI uses a <strong className="text-white">state-of-the-art AI document engine</strong> — tuned for Indian legal drafting. You can watch it draft your document in real-time, word by word.
              </p>
              <div className="space-y-3">
                {[
                  "Trained specifically on Indian legal statutes and formats",
                  "Cites specific sections: BNS, BNSS, Contract Act, TP Act",
                  "Generates complete documents — no truncation, no fillers",
                  "Enterprise API: your data is never used for AI training",
                ].map((pt) => (
                  <div key={pt} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[#76b900] mt-0.5 shrink-0" />
                    <span className="text-white/80 text-sm">{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-[#76b900]/20 rounded-3xl p-6 font-mono text-sm space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#76b900] via-yellow-400 to-[#76b900]" />
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-[#76b900]" />
                <span className="text-muted-foreground text-xs ml-2">kanoon-ai / live-generation</span>
              </div>
              {[
                { label: "Model",     val: "meta/llama-3.3-70b-instruct",   color: "text-[#76b900]" },
                { label: "Document",  val: '"Rent Agreement (Hindi)"',         color: "text-blue-400"  },
                { label: "Streaming", val: "true",                             color: "text-yellow-400"},
                { label: "Words",     val: "847 / est. 900",                   color: "text-green-400" },
                { label: "Time",      val: "42s elapsed",                      color: "text-primary"   },
                { label: "Status",    val: "● Drafting witness section...",    color: "text-[#76b900]" },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-muted-foreground w-24 shrink-0">{label}:</span>
                  <span className={`${color} min-w-0 break-all`}>{val}</span>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-white/10 text-muted-foreground text-xs leading-relaxed">
                <span className="text-white">धारा 5: गवाहों का अनुभाग</span><br />
                यह करार दो गवाहों की उपस्थिति में हस्ताक्षरित किया<br />
                गया है जो इसकी वैधता की पुष्टि करते हैं...
                <span className="inline-block w-2 h-3.5 bg-[#76b900] ml-0.5 animate-pulse align-middle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Pay once per document
          </h2>
          <p className="text-muted-foreground mb-16 max-w-2xl mx-auto">
            No subscriptions. No accounts. Draft free, pay only to unlock your PDF.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            {/* ₹99 tier */}
            <div className="p-8 rounded-3xl bg-card border border-white/10 hover:border-primary/20 transition-all">
              <h3 className="text-xl font-semibold text-white mb-1">Essential</h3>
              <p className="text-muted-foreground text-sm mb-4">Letters, applications & certificates</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl md:text-5xl font-black text-white">₹99</span>
                <span className="text-sm text-muted-foreground">/ document</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {["NOC, RTI & complaint letters", "Certificate applications", "Free AI draft & preview", "Print-ready PDF"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/documents">
                <Button variant="outline" className="w-full h-12">Get Started Free</Button>
              </Link>
            </div>

            {/* ₹199–299 tier */}
            <div className="p-8 rounded-3xl bg-primary/5 border-2 border-primary relative transform md:-translate-y-4 shadow-gold">
              <div className="absolute top-0 right-8 -translate-y-1/2 flex items-center gap-1.5">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-black">MOST POPULAR</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">Standard</h3>
              <p className="text-muted-foreground text-sm mb-4">Agreements, notices & contracts</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl md:text-5xl font-black text-white">₹199–299</span>
                <span className="text-sm text-muted-foreground">/ document</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {["Rent agreements & NDAs", "Legal notices & affidavits", "Free edits within 7 days", "Secure download link"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/documents">
                <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold font-bold">
                  Draft Free Now
                </Button>
              </Link>
              <p className="text-center text-xs text-muted-foreground mt-3">Pay only when you unlock your PDF</p>
            </div>

            {/* ₹499 tier */}
            <div className="p-8 rounded-3xl bg-card border border-white/10 hover:border-primary/20 transition-all">
              <h3 className="text-xl font-semibold text-white mb-1">Premium</h3>
              <p className="text-muted-foreground text-sm mb-4">Complex deeds & petitions</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl md:text-5xl font-black text-white">₹499</span>
                <span className="text-sm text-muted-foreground">/ document</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {["Partnership deeds & wills", "MOUs & business contracts", "Divorce petition drafts", "5 language options"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/documents">
                <Button variant="outline" className="w-full h-12">Get Started Free</Button>
              </Link>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-8">
            Prices exclude 18% GST (added at checkout) · UPI, cards & netbanking via Razorpay · No hidden charges
          </p>
        </div>
      </section>

      {/* ── HOME FAQ ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Common questions
            </h2>
            <p className="text-muted-foreground">Quick answers to what people ask us most.</p>
          </div>
          <div className="space-y-3">
            {HOME_FAQS.map((faq, i) => (
              <HomeFaqItem key={i} q={faq.q} a={faq.a} i={i} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/faq" className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1">
              View all 30+ FAQs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ───────────────────────────────────────────── */}
      <section className="py-12 border-y border-white/5 bg-card/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
            {[
              { val: "25+", label: "Document Types", sub: "rental, business, legal & more" },
              { val: "5", label: "Languages", sub: "English, Hindi, Marathi, Tamil, Telugu" },
              { val: "₹0", label: "Cost to Preview", sub: "always free to draft" },
              { val: "<60s", label: "Average Speed", sub: "start to complete doc" },
            ].map(({ val, label, sub }) => (
              <div key={label} className="p-4 rounded-2xl bg-card/50 border border-white/5">
                <div className="text-2xl md:text-3xl font-black text-primary mb-1">{val}</div>
                <div className="text-white text-xs font-semibold uppercase tracking-wide">{label}</div>
                <div className="text-muted-foreground text-[10px] mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-yellow-500/5 to-primary/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[200px] bg-blue-500/8 rounded-full blur-[80px]" />

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>

            {/* Live pulse badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-semibold mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <TrendingUp className="h-4 w-4" />
              247 Indians generated documents today
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              Your legal document<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-300 to-primary">
                is 60 seconds away
              </span>
            </h2>

            <p className="text-muted-foreground text-lg mb-4">
              Join 12,000+ Indians who stopped overpaying lawyers for routine documents.
            </p>
            <p className="text-primary font-semibold text-sm mb-10">
              ✦ Free to draft & preview · Pay only to download PDF ✦
            </p>

            {/* Urgency mini-bar */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold">
              <Zap className="h-3.5 w-3.5 text-red-400" />
              Today's offer: All documents from ₹97 · Ends at midnight
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/documents" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-16 px-12 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_40px_rgba(234,179,8,0.35)] group">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Create Document Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-16 px-8 text-base border-white/20 text-white hover:bg-white/5">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Talk to Support
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> No account required</span>
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Free preview always</span>
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> 7-day free edits</span>
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Razorpay secured</span>
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> DPDPA 2023 compliant</span>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
