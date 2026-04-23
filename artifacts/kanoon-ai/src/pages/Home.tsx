import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import {
  Shield, Zap, FileText, CheckCircle2, ArrowRight,
  Bot, Download, Star, Quote, Users, Award, Lock, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

// ---------------- Animated Counter ----------------
function Counter({ to, suffix = "", duration = 2 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = 1000 / 60;
    const totalSteps = (duration * 1000) / step;
    const inc = to / totalSteps;
    const id = setInterval(() => {
      start += inc;
      if (start >= to) { setVal(to); clearInterval(id); }
      else setVal(Math.floor(start));
    }, step);
    return () => clearInterval(id);
  }, [inView, to, duration]);

  return <span ref={ref}>{val.toLocaleString("en-IN")}{suffix}</span>;
}

const STATS = [
  { value: 10000, suffix: "+", label: "Documents Generated" },
  { value: 5000,  suffix: "+", label: "Happy Customers" },
  { value: 28,    suffix: "",  label: "Indian States Served" },
  { value: 60,    suffix: "s", label: "Average Generation Time" },
];

const STEPS = [
  { icon: FileText, title: "Pick Your Document",   desc: "Choose from 25+ Indian legal templates — affidavits, NDAs, rental agreements & more." },
  { icon: Bot,      title: "Answer Questions",     desc: "Fill a simple form. Our AI fills in the legal language for you in seconds." },
  { icon: Download, title: "Download & Use",       desc: "Get a print-ready, professionally formatted PDF — ready for stamp paper or registration." },
];

const TESTIMONIALS = [
  { name: "Rahul Sharma",   role: "Small Business Owner, Delhi",  text: "Drafted my partnership deed in 5 minutes. Saved ₹3,000 in lawyer fees. Document was perfect.",   rating: 5 },
  { name: "Priya Patel",    role: "Freelancer, Mumbai",            text: "I send NDAs to clients every week. KanoonAI changed my workflow completely. Worth every rupee.", rating: 5 },
  { name: "Anand Kumar",    role: "Landlord, Bengaluru",           text: "Generated a rental agreement in Hindi for my tenant. Tenant was impressed with the formatting.", rating: 5 },
  { name: "Sneha Reddy",    role: "HR Manager, Hyderabad",         text: "We use it for offer letters and employment contracts. Faster than our old templates.",          rating: 5 },
];

const DOCUMENT_BADGES = [
  "Rental Agreement", "Affidavit", "Legal Notice", "NDA", "MOU",
  "Sale Deed", "Will & Testament", "FIR Application", "RTI Application",
  "Partnership Deed", "Power of Attorney", "Divorce Petition",
];

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Hero Background"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">10,000+ Documents Generated in India</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto"
          >
            60 seconds mein apna <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200">
              legal document ready
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            {t(
              "Draft professional, legally-binding agreements, notices, and affidavits instantly using advanced AI. No lawyer required.",
              "उन्नत एआई का उपयोग करके तुरंत पेशेवर, कानूनी रूप से बाध्यकारी समझौते, नोटिस और हलफनामे तैयार करें। किसी वकील की आवश्यकता नहीं है।"
            )}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
          >
            <Link href="/documents">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold group">
                {t("Create Document Now", "अभी दस्तावेज़ बनाएँ")}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button
              size="lg" variant="outline"
              className="w-full sm:w-auto text-lg h-14 px-8 border-white/20 text-white hover:bg-white/5"
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t("View Pricing", "मूल्य निर्धारण देखें")}
            </Button>
          </motion.div>

          {/* Trust badges row */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> SSL Encrypted</div>
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Razorpay Verified</div>
            <div className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Lawyer-Reviewed Templates</div>
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> 5,000+ Customers</div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 border-y border-white/5 bg-card/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-primary to-yellow-200 mb-2">
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wider uppercase mb-4">
              How It Works
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">From idea to PDF in 3 steps</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No legal jargon. No expensive consultations. Just simple, fast, and trustworthy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {/* Connecting dotted line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px border-t-2 border-dashed border-primary/20 z-0" />
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative z-10 text-center"
                >
                  <div className="relative mx-auto w-24 h-24 mb-6">
                    <div className="absolute inset-0 bg-primary/10 rounded-2xl rotate-45" />
                    <div className="absolute inset-2 bg-card rounded-xl border border-primary/30 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-primary-foreground rounded-full text-sm font-bold flex items-center justify-center shadow-gold">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DOCUMENT SHOWCASE */}
      <section className="py-24 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wider uppercase mb-4">
            25+ Templates
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Every document you'll ever need</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            From rental agreements to wills — drafted to Indian legal standards.
          </p>

          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto mb-10">
            {DOCUMENT_BADGES.map((doc, i) => (
              <motion.div
                key={doc}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="px-4 py-2 rounded-full bg-background border border-white/10 text-sm text-white hover:border-primary/40 hover:text-primary transition-all cursor-default"
              >
                {doc}
              </motion.div>
            ))}
            <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-sm text-primary font-medium">
              + 13 More
            </div>
          </div>

          <Link href="/documents">
            <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              Browse All Templates <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Why KanoonAI?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Built for Indians. Trusted across India.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-card border border-white/5 shadow-lg hover:border-primary/30 transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">Generate complete, print-ready legal documents in under a minute simply by answering a few questions.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-white/5 shadow-lg relative overflow-hidden hover:border-primary/30 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Legally Sound</h3>
              <p className="text-muted-foreground">Drafts are structured based on Indian legal standards and include necessary stamp duty notices and clauses.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-white/5 shadow-lg hover:border-primary/30 transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">5 Languages</h3>
              <p className="text-muted-foreground">Generate documents in English, Hindi, Marathi, Tamil, and Telugu — instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wider uppercase mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Loved across India</h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="flex">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-primary fill-primary" />)}
              </div>
              <span>4.9/5 from 1,200+ reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-white/10 hover:border-primary/30 transition-all relative"
              >
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
                <div className="flex mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="h-4 w-4 text-primary fill-primary" />)}
                </div>
                <p className="text-white/90 mb-5 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wider uppercase mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground mb-16 max-w-2xl mx-auto">Pay per document or subscribe for unlimited access.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            <div className="p-8 rounded-3xl bg-card border border-white/10 hover:border-primary/30 transition-all">
              <h3 className="text-xl font-semibold text-white mb-2">Pay Per Doc</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="text-4xl font-bold text-white">₹99</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Single PDF Download</li>
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> 5 Languages Supported</li>
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Standard Email Support</li>
              </ul>
              <Link href="/documents"><Button variant="outline" className="w-full">Get Started</Button></Link>
            </div>

            <div className="p-8 rounded-3xl bg-primary/5 border border-primary relative transform md:-translate-y-4 shadow-gold">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">MOST POPULAR</div>
              <h3 className="text-xl font-semibold text-white mb-2">Basic Plan</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">₹299</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-white"><CheckCircle2 className="h-5 w-5 text-primary" /> 5 Documents / month</li>
                <li className="flex items-center gap-3 text-white"><CheckCircle2 className="h-5 w-5 text-primary" /> Priority Support</li>
                <li className="flex items-center gap-3 text-white"><CheckCircle2 className="h-5 w-5 text-primary" /> Free Edits (7 days)</li>
                <li className="flex items-center gap-3 text-white"><CheckCircle2 className="h-5 w-5 text-primary" /> No Watermark</li>
              </ul>
              <Link href="/pricing"><Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Subscribe Now</Button></Link>
            </div>

            <div className="p-8 rounded-3xl bg-card border border-white/10 hover:border-primary/30 transition-all">
              <h3 className="text-xl font-semibold text-white mb-2">Pro Plan</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">₹699</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Unlimited Documents</li>
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Lawyer Consultation (15min)</li>
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> API Access</li>
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> White-label Output</li>
              </ul>
              <Link href="/pricing"><Button variant="outline" className="w-full">Subscribe Now</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
            <div className="relative z-10">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Ready to draft your first document?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join 5,000+ Indians saving time and money on legal documents. Free to draft. ₹99 to download.
              </p>
              <Link href="/documents">
                <Button size="lg" className="text-lg h-14 px-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold">
                  Get Started — Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
