import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Lock, FileDown, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetDocument, useCreatePaymentOrder, useVerifyPayment } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

// Declaring Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function DocumentPreview() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: doc, isLoading } = useGetDocument(Number(id));
  const createOrderMutation = useCreatePaymentOrder();
  const verifyPaymentMutation = useVerifyPayment();

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
  }, []);

  const handlePayment = async () => {
    if (!doc) return;
    try {
      const order = await createOrderMutation.mutateAsync({
        data: { documentId: doc.id, amount: doc.price }
      });

      const options = {
        key: order.keyId,
        amount: order.amount * 100, // paisa
        currency: order.currency,
        name: "KanoonAI",
        description: doc.title,
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            await verifyPaymentMutation.mutateAsync({
              data: {
                documentId: doc.id,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              }
            });
            toast({ title: "Payment Successful", description: "Document unlocked!" });
            setLocation(`/documents/${doc.id}/download`);
          } catch (e) {
            toast({ title: "Verification Failed", variant: "destructive" });
          }
        },
        theme: { color: "#F5C518" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast({ title: "Payment Initiation Failed", variant: "destructive" });
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

  if (doc.paid) {
    setLocation(`/documents/${doc.id}/download`);
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 lg:flex gap-8">
        
        {/* Left Side: Preview */}
        <div className="flex-1 mb-8 lg:mb-0">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="mb-4 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          <div className="bg-white text-black p-8 md:p-12 rounded-lg shadow-xl relative min-h-[800px] font-serif leading-relaxed text-sm md:text-base">
            <div className="whitespace-pre-wrap select-none unpaid-blur">
              {doc.content || "Drafting in progress... AI is formatting your details.\n\nTHIS DEED OF AGREEMENT is made on this day...\n\nBETWEEN\nParty A and Party B..."}
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="bg-background/80 backdrop-blur-sm p-6 rounded-2xl border border-white/10 text-center flex flex-col items-center">
                <Lock className="h-10 w-10 text-primary mb-2" />
                <h3 className="text-white font-bold text-xl">Preview Mode</h3>
                <p className="text-muted-foreground text-sm max-w-xs mt-1">
                  Pay ₹{doc.price} to unlock, remove watermarks, and download the full PDF.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Checkout Panel */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-card border border-white/10 rounded-2xl p-6 sticky top-24 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Order Summary</h2>
            <div className="text-muted-foreground text-sm mb-6 pb-6 border-b border-white/10">
              {doc.title}
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-white">
                <span>Subtotal</span>
                <span>₹{doc.price}</span>
              </div>
              <div className="flex justify-between text-white">
                <span>GST (18%)</span>
                <span>₹{Math.round(doc.price * 0.18)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary pt-4 border-t border-white/10">
                <span>Total Amount</span>
                <span>₹{doc.price + Math.round(doc.price * 0.18)}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> High-quality Print Ready PDF</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Watermark removed</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Free edits for 7 days</li>
            </ul>

            <Button 
              className="w-full h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold"
              onClick={handlePayment}
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Lock className="mr-2 h-5 w-5" />}
              Pay ₹{doc.price + Math.round(doc.price * 0.18)}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
              Secured by Razorpay. UPI, Cards, NetBanking accepted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
