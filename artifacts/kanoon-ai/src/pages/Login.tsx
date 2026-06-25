import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useAuthStore } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import {
  Scale, CheckCircle2, Shield, Zap, FileText, Star,
  Lock, Clock, Award, ChevronRight,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const BENEFITS = [
  { icon: Zap,         text: "Document drafted by NVIDIA AI in 60 seconds" },
  { icon: FileText,    text: "25+ Indian legal document templates" },
  { icon: Shield,      text: "Razorpay-secured payments, 7-day refund guarantee" },
  { icon: Lock,        text: "DPDPA 2023 compliant — your data is private" },
  { icon: Award,       text: "Lawyer-reviewed templates, India-specific clauses" },
];

const TESTIMONIALS = [
  {
    name: "Ravi Shankar",
    city: "Mumbai",
    role: "Landlord",
    text: "Generated my rent agreement in 2 minutes. Saved ₹4,000 vs a local lawyer.",
    stars: 5,
    doc: "Rent Agreement",
  },
  {
    name: "Priya Menon",
    city: "Bengaluru",
    role: "Startup Founder",
    text: "NDA with our partner was ready before the call ended. Kanoox AI is incredible.",
    stars: 5,
    doc: "NDA",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
      ))}
    </div>
  );
}

export default function Login() {
  useSeo({
    title: "Sign In — Kanoox AI | India's #1 AI Legal Document Platform",
    description: "Sign in to Kanoox AI with your Google account to draft and download Indian legal documents instantly.",
  });

  const [, setLocation] = useLocation();
  const { token } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      let redirect = "/dashboard";
      try {
        const stored = sessionStorage.getItem("kanoon_redirect_after_login");
        if (stored) {
          redirect = stored;
          sessionStorage.removeItem("kanoon_redirect_after_login");
        }
      } catch {}
      setLocation(redirect.startsWith("/") ? redirect : "/dashboard");
    }
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error === "no_google_config") {
      toast({ title: "Configuration Missing", description: "Google OAuth is not configured yet. Please contact support.", variant: "destructive", duration: 6000 });
    } else if (error === "google_denied") {
      toast({ title: "Login Cancelled", description: "You cancelled the Google sign-in.", variant: "destructive" });
    } else if (error === "server_error") {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    }
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${BASE}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden">

        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] pointer-events-none -translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none translate-x-1/4 translate-y-1/4" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        <div className="relative z-10">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-16 group">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-gold group-hover:scale-105 transition-transform">
              <Scale className="h-5.5 w-5.5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Kanoox<span className="text-primary"> AI</span>
            </span>
          </Link>

          {/* Headline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/25 rounded-full text-primary text-xs font-semibold mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              12,000+ Indians trust Kanoox AI
            </div>

            <h1 className="text-3xl xl:text-4xl font-black text-white mb-4 leading-tight">
              India's #1 AI<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-300 to-primary">
                Legal Document
              </span>{" "}
              Platform
            </h1>

            <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-sm">
              Generate lawyer-quality documents in 60 seconds. No appointments. No jargon. Free to preview.
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.ul
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-3.5 mb-12"
          >
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.li
                  key={b.text}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-white/80 text-sm">{b.text}</span>
                </motion.li>
              );
            })}
          </motion.ul>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="grid grid-cols-3 gap-4 mb-12 p-5 bg-card/50 border border-white/8 rounded-2xl"
          >
            {[
              { value: "12,000+", label: "Customers" },
              { value: "25+",    label: "Doc Types" },
              { value: "60 sec", label: "Avg Time" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-black text-primary mb-0.5">{s.value}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Testimonial cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 space-y-3"
        >
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-card/60 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {t.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-white font-medium text-sm">{t.name}</span>
                      <span className="text-muted-foreground text-xs ml-1.5">· {t.city} · {t.role}</span>
                    </div>
                    <Stars count={t.stars} />
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">"{t.text}"</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full text-primary text-[10px] font-medium">
                    <FileText className="h-2.5 w-2.5" />{t.doc}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/8 rounded-full blur-[90px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-gold">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-white">
              Kanoox<span className="text-primary"> AI</span>
            </span>
          </div>

          {/* Auth card */}
          <div className="bg-card border border-white/12 rounded-3xl p-8 shadow-2xl">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="hidden lg:flex justify-center mb-5">
                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/25 shadow-gold">
                  <Scale className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Kanoox AI</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sign in to generate professional legal documents instantly. Free to preview — pay only to download.
              </p>
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 h-13 px-6 bg-white text-gray-800 font-semibold rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 shadow-md hover:shadow-lg border border-gray-200 mb-6"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Quick trust row */}
            <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground mb-6">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />Secure
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />No password
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />100% private
              </span>
            </div>

            <div className="border-t border-white/8 pt-5">
              <p className="text-xs text-center text-muted-foreground leading-relaxed mb-5">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </p>

              {/* What you unlock */}
              <div className="bg-background/60 border border-white/8 rounded-2xl p-4 space-y-2.5">
                <p className="text-xs text-white/60 uppercase tracking-wider font-medium mb-3">What you get after signing in</p>
                {[
                  "Access your generated documents anytime",
                  "Re-download any paid document",
                  "Renewal reminders for rent agreements",
                  "Refer friends and earn ₹50 per referral",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground text-xs">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom link */}
          <div className="text-center mt-5">
            <Link href="/documents">
              <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Browse templates without signing in
              </span>
            </Link>
          </div>

          {/* Mobile mini stats */}
          <div className="lg:hidden flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" />60 sec avg</span>
            <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-primary text-primary" />4.9/5 rated</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" />DPDPA compliant</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
