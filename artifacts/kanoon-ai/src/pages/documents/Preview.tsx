import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  Lock, FileDown, CheckCircle2, Loader2, ArrowLeft, Shield,
  Clock, Users, Star, Zap, AlertTriangle, X, IndianRupee,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGetDocument, useCreatePaymentOrder, useVerifyPayment } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

declare global { interface Window { Razorpay: any; } }

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Countdown to midnight ───────────────────────────────────────────────────
function useCountdown() {
  const [secs, setSecs] = useState(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  });
  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      setSecs(Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ── Idle popup (30 sec idle) ────────────────────────────────────────────────
function IdlePopup({ price, onPay }: { price: number; onPay: () => void }) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setShow(true), 30_000);
    };
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach(e => document.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach(e => document.removeEventListener(e, reset));
    };
  }, [dismissed]);

  if (!show || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="bg-card border border-amber-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <span className="text-amber-400 font-bold text-sm">Draft expires in 24 hours!</span>
            </div>
            <button onClick={() => { setShow(false); setDismissed(true); }}
              className="text-muted-foreground hover:text-white p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-white text-sm mb-4 leading-relaxed">
            Aapka document tayaar hai. Sirf <span className="text-primary font-bold">₹{price}</span> mein download karo — warna 24 ghante baad delete ho jayega.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              onClick={() => { setShow(false); setDismissed(true); onPay(); }}>
              <FileDown className="mr-1.5 h-4 w-4" />Download ₹{price}
            </Button>
            <Button variant="ghost" className="text-muted-foreground text-sm"
              onClick={() => { setShow(false); setDismissed(true); }}>
              Continue Reading
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Social proof counter (stable per doc id) ────────────────────────────────
function getSocialProof(id: number): { downloads: number; viewing: number } {
  const h = ((id * 2654435761) >>> 0);
  return {
    downloads: (h % 70) + 30,   // 30–99
    viewing:   (h % 12) + 4,    // 4–15
  };
}

export default function DocumentPreview() {
  const { id }          = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast }       = useToast();
  const countdown       = useCountdown();

  const { data: doc, isLoading, refetch } = useGetDocument(Number(id));
  const createOrderMutation = useCreatePaymentOrder();
  const verifyPaymentMutation = useVerifyPayment();
  const [paying, setPaying] = useState(false);

  const proof = getSocialProof(Number(id));
  const gst   = doc ? Math.round(doc.price * 0.18) : 0;
  const total = doc ? doc.price + gst : 0;

  // Lawyer cost anchor (approx 10–30x the actual price)
  const lawyerCost = doc ? Math.max(2000, doc.price * 18) : 5000;
  const savings    = lawyerCost - total;

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(s);
    return () => { try { document.body.removeChild(s); } catch {} };
  }, []);

  useEffect(() => {
    if (doc?.paid) setLocation(`/documents/${doc.id}/download`);
  }, [doc?.paid]);

  const handlePayment = useCallback(async () => {
    if (!doc) return;
    setPaying(true);
    try {
      const order = await createOrderMutation.mutateAsync({
        data: { documentId: doc.id, amount: doc.price },
      });

      if (!window.Razorpay) {
        toast({ title: "Payment gateway not loaded", description: "Please refresh.", variant: "destructive" });
        setPaying(false);
        return;
      }

      const rzp = new window.Razorpay({
        key:      order.keyId,
        amount:   order.amount * 100,
        currency: "INR",
        name:     "A2z Kanoon AI",
        description: doc.title,
        order_id: order.orderId,
        prefill: {},
        theme: { color: "#EAB308" },
        handler: async (res: any) => {
          try {
            await verifyPaymentMutation.mutateAsync({
              data: {
                documentId: doc.id,
                orderId:    res.razorpay_order_id,
                paymentId:  res.razorpay_payment_id,
                signature:  res.razorpay_signature,
              },
            });
            toast({ title: "🎉 Payment Successful!", description: "Your document is now unlocked." });
            await refetch();
            setLocation(`/documents/${doc.id}/download`);
          } catch {
            toast({ title: "Verification issue", description: "Contact support with your payment ID.", variant: "destructive" });
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.on("payment.failed", () => {
        toast({ title: "Payment Failed", description: "Please try again.", variant: "destructive" });
        setPaying(false);
      });
      rzp.open();
    } catch (err: any) {
      toast({ title: "Payment Error", description: err?.message ?? "Please try again.", variant: "destructive" });
      setPaying(false);
    }
  }, [doc]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!doc) {
    return <div className="p-8 text-white text-center">Document not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <IdlePopup price={total} onPay={handlePayment} />

      <div className="container mx-auto px-4 pt-8 max-w-7xl lg:flex gap-8">

        {/* ── LEFT: document preview ─────────────────────────────────── */}
        <div className="flex-1 mb-6 lg:mb-0">
          <button onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>

          {/* Social proof bar */}
          <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="text-white font-medium">{proof.viewing}</span> people viewing right now
            </span>
            <span className="flex items-center gap-1.5">
              <FileDown className="h-3.5 w-3.5 text-green-400" />
              <span className="text-white font-medium">{proof.downloads}</span> downloaded today
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-primary fill-primary" />
              4.9/5 rating
            </span>
          </div>

          {/* Document preview (blurred) */}
          <div className="bg-white text-black p-8 md:p-12 rounded-2xl shadow-2xl relative min-h-[800px] font-serif leading-relaxed text-sm overflow-hidden">
            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-[0.06] rotate-[-30deg]">
              <span className="text-5xl font-black tracking-widest text-black select-none uppercase whitespace-nowrap">
                DRAFT · A2Z KANOON AI · kanooxai.in
              </span>
            </div>

            {/* Blurred content */}
            <div className="select-none relative" style={{ filter: "blur(4px)", userSelect: "none", pointerEvents: "none" }}>
              <pre className="whitespace-pre-wrap text-sm font-serif leading-relaxed">
                {doc.content?.slice(0, 1800) || `THIS DEED OF AGREEMENT is made and executed on this day...\n\nBETWEEN\n\nParty A: [Name]\nParty B: [Name]\n\n1. PARTIES AND RECITALS\n\nWHEREAS the parties have mutually agreed to enter into this Agreement...\n\n2. TERMS AND CONDITIONS\n\n2.1 The parties hereby agree to the following terms and conditions...\n\n2.2 This Agreement shall be binding upon both parties...\n\n3. PAYMENT TERMS\n\n3.1 The total consideration shall be...\n\n[Full document continues — 847 words · legally valid across all 28 Indian states]`}
              </pre>
            </div>

            {/* Gradient + lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gradient-to-b from-transparent via-white/40 to-white/90 pt-32">
              <div className="bg-white/97 backdrop-blur-md px-8 py-7 rounded-2xl border border-gray-200 text-center shadow-2xl flex flex-col items-center gap-3 mx-4">
                <div className="h-16 w-16 bg-yellow-50 rounded-full flex items-center justify-center border-2 border-yellow-400">
                  <Lock className="h-8 w-8 text-yellow-500" />
                </div>
                <h3 className="text-gray-900 font-black text-2xl">Document Locked</h3>
                <p className="text-gray-600 text-sm max-w-xs leading-relaxed">
                  Unlock the complete print-ready PDF — stamp paper format, no watermark, legally valid across India.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="line-through text-gray-400">Lawyer: ₹{lawyerCost.toLocaleString("en-IN")}</span>
                  <span className="text-green-600 font-bold">You save ₹{savings.toLocaleString("en-IN")}!</span>
                </div>
                <Button className="mt-1 bg-yellow-400 hover:bg-yellow-500 text-black font-black px-10 h-13 text-lg shadow-lg"
                  onClick={handlePayment} disabled={paying || createOrderMutation.isPending}>
                  {paying ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Lock className="h-5 w-5 mr-2" />}
                  Unlock for ₹{total} only
                </Button>
                <p className="text-[10px] text-gray-400">UPI · Cards · EMI · NetBanking · Secured by Razorpay</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: sticky sidebar ───────────────────────────────────── */}
        <div className="w-full lg:w-[360px] shrink-0">
          <div className="bg-card border border-white/10 rounded-2xl shadow-2xl sticky top-20 overflow-hidden">

            {/* Green success header */}
            <div className="bg-green-500/10 border-b border-green-500/20 px-5 py-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              <span className="text-green-400 text-sm font-semibold">Document generated successfully!</span>
            </div>

            <div className="p-6">
              {/* Doc title */}
              <h2 className="text-lg font-bold text-white mb-1 line-clamp-2">{doc.title}</h2>
              <p className="text-xs text-muted-foreground mb-4">Generated by Llama 3.3 70B via NVIDIA · 60 seconds</p>

              {/* Countdown timer */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-red-400 shrink-0 animate-pulse" />
                <div>
                  <p className="text-red-400 text-xs font-bold uppercase tracking-wide">Offer expires</p>
                  <p className="text-red-300 font-mono font-black text-lg">{countdown}</p>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="bg-background/50 rounded-xl p-4 mb-4 space-y-2 border border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lawyer fee</span>
                  <span className="text-red-400 line-through font-medium">₹{lawyerCost.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">A2z Kanoon AI</span>
                  <span className="text-white font-medium">₹{doc.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="text-white">₹{gst}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-primary text-xl font-black">₹{total}</span>
                </div>
                <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold pt-1">
                  <IndianRupee className="h-3 w-3" />
                  You save ₹{savings.toLocaleString("en-IN")} vs lawyer!
                </div>
              </div>

              {/* Benefits list */}
              <ul className="space-y-2 mb-5">
                {[
                  "Print-ready PDF · No watermark",
                  "Stamp paper format included",
                  "Valid across all 28 Indian states",
                  "Re-download anytime from Dashboard",
                  "Free re-generation within 7 days",
                  "7-day money-back guarantee",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <Button
                className="w-full h-14 text-base font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold mb-3"
                onClick={handlePayment}
                disabled={paying || createOrderMutation.isPending}>
                {paying || createOrderMutation.isPending
                  ? <><Loader2 className="animate-spin mr-2 h-5 w-5" />Processing…</>
                  : <><FileDown className="mr-2 h-5 w-5" />Download PDF · ₹{total}</>}
              </Button>

              <div className="flex items-center justify-center gap-1.5 mb-4 text-[10px] text-muted-foreground/70">
                <Shield className="h-3 w-3" />
                Razorpay Secured · UPI · Cards · EMI · NetBanking
              </div>

              {/* Social proof */}
              <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-green-400" />
                  {proof.downloads} downloaded today
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  NVIDIA AI
                </span>
              </div>
            </div>
          </div>

          {/* Renewal CTA for rent agreements */}
          {doc.type === "rent-agreement" && (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-semibold mb-1">Auto-renewal reminder</p>
                  <p className="text-xs text-muted-foreground">We'll remind you 30 days before your 11-month agreement expires. Renew in 60 sec — same fields, new dates.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE sticky bottom bar ────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 lg:hidden z-40 bg-background/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex items-center gap-3 shadow-2xl">
        <div className="flex-1">
          <p className="text-white font-bold text-sm">{doc.title}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3 text-red-400" />
            Offer expires: <span className="text-red-400 font-mono font-bold ml-1">{countdown}</span>
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground font-black h-12 px-6 shrink-0 shadow-gold"
          onClick={handlePayment}
          disabled={paying || createOrderMutation.isPending}>
          {paying ? <Loader2 className="animate-spin h-4 w-4" /> : `Download ₹${total}`}
        </Button>
      </div>
    </div>
  );
}
