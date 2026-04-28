import { motion } from "framer-motion";
import { Shield } from "lucide-react";

import { useSeo } from "@/hooks/use-seo";

export default function PrivacyPolicy() {
  useSeo({
    title: "Privacy Policy — KanoonAI",
    description: "How KanoonAI collects, uses, and protects your data. DPDPA 2023 compliant. Read our full Privacy Policy.",
  });
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground mb-8 text-sm">Last updated: March 1, 2025</p>

          <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
              <p>KanoonAI ("we", "our", or "the Company") collects the following types of information when you use our platform:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong className="text-white">Account Information:</strong> Your name and email address collected via Google Sign-In.</li>
                <li><strong className="text-white">Document Data:</strong> The information you provide to generate legal documents (e.g., party names, addresses, dates, terms). This data is stored to allow you to download and reaccess your documents.</li>
                <li><strong className="text-white">Payment Information:</strong> We use Razorpay for payments. We do not store your card details. We only store the Razorpay order ID and payment ID for transaction records.</li>
                <li><strong className="text-white">Usage Data:</strong> Browser type, IP address, pages visited, and time spent, collected for analytics and to improve our service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>To create and maintain your account</li>
                <li>To generate AI-powered legal documents based on the information you provide</li>
                <li>To process payments and send receipts</li>
                <li>To send important service notifications (no spam)</li>
                <li>To improve our AI models and document quality</li>
                <li>To comply with applicable Indian laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Data Sharing</h2>
              <p>We do <strong className="text-white">not</strong> sell, rent, or trade your personal information. We share data only with:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong className="text-white">Google (Gemini AI):</strong> Your document form data is sent to Google's Gemini AI for document generation via secure enterprise API. Google does not train on API data by default.</li>
                <li><strong className="text-white">Razorpay:</strong> Payment processing. Governed by Razorpay's Privacy Policy.</li>
                <li><strong className="text-white">Google:</strong> Authentication only. We receive your name, email, and profile photo.</li>
                <li><strong className="text-white">Legal Authorities:</strong> If required by law or court order under Indian law (IT Act, 2000).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage & Security</h2>
              <p>Your data is stored on secure servers hosted in India or within the EU region (Replit cloud infrastructure). We use:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>HTTPS/TLS encryption for all data in transit</li>
                <li>Encrypted database storage at rest</li>
                <li>JWT-based authentication with secure token expiry</li>
                <li>Regular security audits</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Your Rights (Indian Data Protection)</h2>
              <p>Under the Digital Personal Data Protection Act, 2023 (DPDPA), you have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Access the personal data we hold about you</li>
                <li>Correct inaccurate personal data</li>
                <li>Request erasure of your data (right to be forgotten)</li>
                <li>Withdraw consent for data processing</li>
                <li>Nominate a person to exercise rights on your behalf</li>
              </ul>
              <p className="mt-2">To exercise any right, email us at: <strong className="text-primary">privacy@kanoonai.in</strong></p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Cookies</h2>
              <p>We use essential cookies for session management and authentication. We do not use tracking or advertising cookies. You can disable cookies in your browser, but this may affect functionality.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Children's Privacy</h2>
              <p>KanoonAI is not directed at children under 18 years of age. We do not knowingly collect personal data from minors.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify registered users by email of any material changes. Continued use of the service after changes constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Grievance Officer</h2>
              <p>As required by the Information Technology Act, 2000, our Grievance Officer is:</p>
              <div className="mt-2 bg-card border border-white/10 rounded-xl p-4">
                <p className="text-white font-medium">KanoonAI Support Team</p>
                <p>Email: <strong className="text-primary">legal@kanoonai.in</strong></p>
                <p>Response time: Within 30 days</p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
