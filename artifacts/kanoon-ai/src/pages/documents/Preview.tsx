import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Lock, FileDown, CheckCircle2, Loader2, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetDocument, useCreatePaymentOrder, useVerifyPayment } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window { Razorpay: any; }
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function DocumentPreview() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: doc, isLoading, refetch } = useGetDocument(Number(id));
  const createOrderMutation = useCreatePaymentOrder();
  const verifyPaymentMutation = useVerifyPayment();
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    if (doc?.paid) {
      setLocation(`/documents/${doc.id}/download`);
    }
  }, [doc?.paid]);

  const handlePayment = async () => {
    if (!doc) return;
    setPaying(true);
    try {
      const order = await createOrderMutation.mutateAsync({
        data: { documentId: doc.id, amount: doc.price }
      });

      const options = {
        key: order.keyId,
        amount: order.amount * 100,
        currency: order.currency,
        name: "Kanoox AI",
        description: doc.title,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await verifyPaymentMutation.mutateAsync({
              data: {
                documentId: doc.id,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }
            });
            toast({ title: "Payment Successful!", description: "Your document is now unlocked." });
            await refetch();
            setLocation(`/documents/${doc.id}/download`);
          } catch {
            toast({ title: "Verification Failed", description: "Payment received but verification failed. Contact support.", variant: "destructive" });
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
        prefill: {},
        theme: { color: "#F5C518" },
      };

      if (!window.Razorpay) {
        toast({ title: "Payment gateway not loaded", description: "Please refresh and try again.", variant: "destructive" });
        setPaying(false);
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        toast({ title: "Payment Failed", description: "Please try again.", variant: "destructive" });
        setPaying(false);
      });
      rzp.open();
    } catch (error: any) {
      toast({ title: "Payment Initiation Failed", description: error?.message || "Please try again.", variant: "destructive" });
      setPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doc) return <div className="p-8 text-white text-center">Document not found</div>;

  const gst = Math.round(doc.price * 0.18);
  const totalAmount = doc.price + gst;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 lg:flex gap-8 max-w-7xl">

        {/* Left: Preview */}
        <div className="flex-1 mb-8 lg:mb-0">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="mb-4 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>

          <div className="bg-white text-black p-8 md:p-12 rounded-lg shadow-xl relative min-h-[800px] font-serif leading-relaxed text-sm overflow-hidden">
            {/* Blurred preview content */}
            <div className="select-none" style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>
              <pre className="whitespace-pre-wrap text-sm font-serif leading-relaxed">
                {doc.content || "This document is being prepared...\n\nTHIS DEED OF AGREEMENT is made on this day...\n\nBETWEEN\nParty A: [Name]\nParty B: [Name]\n\n1. RECITALS\n\nWHEREAS the parties have agreed to enter into this Agreement...\n\n2. TERMS AND CONDITIONS\n\n2.1 The parties hereby agree to the following terms...\n\n[Full document content hidden - Purchase to unlock]"}
              </pre>
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-gradient-to-b from-transparent via-white/50 to-white/80">
              <div className="bg-white/95 backdrop-blur-sm px-8 py-6 rounded-2xl border border-gray-200 text-center shadow-2xl flex flex-col items-center gap-3">
                <div className="h-16 w-16 bg-yellow-50 rounded-full flex items-center justify-center border-2 border-yellow-400">
                  <Lock className="h-8 w-8 text-yellow-500" />
                </div>
                <h3 className="text-gray-900 font-bold text-xl">Document Locked</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Pay ₹{totalAmount} (incl. GST) to unlock, download, and print the full document.
                </p>
                <Button
                  className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-11"
                  onClick={handlePayment}
                  disabled={paying || createOrderMutation.isPending}
                >
                  {paying ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                  Unlock for ₹{totalAmount}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-card border border-white/10 rounded-2xl p-6 sticky top-24 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Order Summary</h2>
            <p className="text-muted-foreground text-sm mb-6 pb-4 border-b border-white/10 truncate">{doc.title}</p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-white">
                <span className="text-muted-foreground">Document price</span>
                <span>₹{doc.price}</span>
              </div>
              <div className="flex justify-between text-sm text-white">
                <span className="text-muted-foreground">GST (18%)</span>
                <span>₹{gst}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary pt-3 border-t border-white/10">
                <span>Total</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-sm text-muted-foreground">
              {[
                "High-quality Print-Ready PDF",
                "No watermark on download",
                "Re-download anytime from Dashboard",
                "Free re-generation within 7 days",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold"
              onClick={handlePayment}
              disabled={paying || createOrderMutation.isPending}
            >
              {paying || createOrderMutation.isPending ? (
                <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Processing...</>
              ) : (
                <><FileDown className="mr-2 h-5 w-5" /> Pay ₹{totalAmount} & Download</>
              )}
            </Button>

            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              Secured by Razorpay · UPI, Cards, NetBanking
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
