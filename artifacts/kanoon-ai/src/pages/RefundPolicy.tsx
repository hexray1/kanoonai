import { motion } from "framer-motion";
import { PenLine, ArrowLeft, MessageCircle, FileText, BadgeCheck } from "lucide-react";
import { Link } from "wouter";
import { useSeo } from "@/hooks/use-seo";

export default function RefundPolicy() {
  useSeo({
    title: "Refund & Edit Policy — Kanoon AI",
    description: "Kanoon AI's policy for digital legal documents: free preview before payment and free edits for 7 days after payment.",
  });
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back nav */}
        <Link href="/">
          <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 cursor-pointer group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </div>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="bg-card border border-white/10 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
              <PenLine className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Refund & Edit Policy</h1>
              <p className="text-muted-foreground text-sm">Last updated: September 26, 2026 · Free preview before you pay, free edits for 7 days after</p>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-primary mb-2">7-Day Free Edit Access</h2>
            <p className="text-muted-foreground">Every purchase includes free edits for 7 days after payment. Correct any detail and regenerate your document — new version, new PDF, no extra charge. This is edit access, not a refund.</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Try Before You Pay</h2>
              <p>
                Every document is drafted and previewed <strong className="text-white">completely free</strong>. You see the
                full generated document before any payment screen appears — so you always know exactly what you are buying.
                Payment unlocks the final print-ready PDF.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Why Digital Documents Are Non-Refundable</h2>
              <p>
                Once payment is captured, the final PDF is generated and delivered to you instantly. Because a digital
                document cannot be "returned", all sales are <strong className="text-white">final and non-refundable</strong> —
                this is standard for instantly-delivered digital goods.
              </p>
              <p className="mt-2">
                Instead of refunds, we give you two stronger protections: a <strong className="text-white">free full preview before payment</strong>,
                and <strong className="text-white">7 days of free edits after payment</strong>. If a name, date, or clause is wrong,
                fix it and regenerate at no cost.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Exceptions</h2>
              <p>A refund may be issued only in these cases:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>You were <strong className="text-white">charged twice</strong> for the same document (duplicate charge) — the duplicate is refunded in full.</li>
                <li>Payment was captured but the PDF could not be delivered due to a <strong className="text-white">technical failure on our end</strong> and could not be recovered.</li>
              </ul>
              <p className="mt-2">
                Refunds are processed to the original payment method via Razorpay within 5–7 business days of approval.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">How to Request</h2>
              <p>
                Contact us with your payment/order details and a description of the issue. Each request is reviewed
                individually against the exceptions above.
              </p>
            </section>

            <section className="bg-card border border-white/10 rounded-2xl p-6 flex items-start gap-4">
              <MessageCircle className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                  Questions about a payment? <BadgeCheck className="h-4 w-4 text-primary" />
                </h3>
                <p className="text-sm">
                  Reach us via the <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
                  Include your order ID (shown on the payment receipt) so we can help faster.
                </p>
              </div>
            </section>

            <section className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              <span>Also see our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> for the full purchase terms.</span>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
