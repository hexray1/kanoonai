import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Link } from "wouter";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <RotateCcw className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-white">Refund Policy</h1>
          </div>
          <p className="text-muted-foreground mb-8 text-sm">Last updated: March 1, 2025</p>

          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-green-400 mb-2">7-Day Money Back Guarantee</h2>
            <p className="text-green-200">We stand behind the quality of our AI-generated documents. If you are not satisfied with your purchase for any reason, we offer a full refund within 7 days — no questions asked.</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Refund Eligibility</h2>
              <p>You are eligible for a full refund if:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Your refund request is made within <strong className="text-white">7 calendar days</strong> of payment</li>
                <li>The document was generated but you are unsatisfied with the quality</li>
                <li>The document could not be generated due to a technical error on our end</li>
                <li>You were charged twice for the same document (duplicate charge)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Non-Refundable Cases</h2>
              <p>Refunds will <strong className="text-white">not</strong> be issued in the following situations:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Refund request made after 7 days of payment</li>
                <li>You provided incorrect or insufficient information in the form and the document was generated as per your inputs</li>
                <li>The document was used in a legal proceeding (you accepted responsibility upon download)</li>
                <li>Subscription plans where more than 1 document has been generated in the billing cycle</li>
                <li>Referral credits and promotional discounts are non-refundable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">How to Request a Refund</h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Go to your <Link href="/dashboard"><span className="text-primary hover:underline cursor-pointer">Dashboard</span></Link> → select the document → click "Request Refund"</li>
                <li>Or email us at <strong className="text-primary">refunds@kanoonai.in</strong> with:
                  <ul className="list-disc pl-6 mt-1 space-y-1 text-sm">
                    <li>Your registered email address</li>
                    <li>The document type and date of purchase</li>
                    <li>Razorpay payment ID (found in your email receipt)</li>
                    <li>Reason for refund (optional but helps us improve)</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Refund Processing Time</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {[
                  { step: "1", label: "Request Submitted", time: "Instant" },
                  { step: "2", label: "Review & Approval", time: "1–2 business days" },
                  { step: "3", label: "Money Credited", time: "5–7 business days" },
                ].map((item) => (
                  <div key={item.step} className="bg-card border border-white/10 rounded-xl p-4 text-center">
                    <div className="h-8 w-8 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold mx-auto mb-2">{item.step}</div>
                    <p className="text-white text-sm font-medium">{item.label}</p>
                    <p className="text-muted-foreground text-xs mt-1">{item.time}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm">Refunds are credited back to the original payment method (UPI, credit card, debit card, or bank account). Bank processing times may vary.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Subscription Cancellation</h2>
              <p>You may cancel your subscription at any time from your Dashboard. Upon cancellation:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Your access continues until the end of the current billing period</li>
                <li>No further charges will be made</li>
                <li>Unused document credits in the current period are forfeited</li>
                <li>Partial-month refunds are not provided unless within the 7-day window of first subscription</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
              <p>For refund-related queries: <strong className="text-primary">refunds@kanoonai.in</strong></p>
              <p className="mt-1">We respond to all refund requests within 1 business day.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
