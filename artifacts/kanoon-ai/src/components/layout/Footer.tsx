import { useState } from "react";
import { Link } from "wouter";
import {
  Scale, Mail, Phone, MapPin, Shield, Award, Lock, CheckCircle2,
  Twitter, Facebook, Linkedin, Instagram, Send,
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

export function Footer() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handlePricing = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("pricing");
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else window.location.href = "/#pricing";
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    toast({ title: "Subscribed!", description: "You'll receive Indian legal updates & 10% off your first document." });
    setEmail("");
  };

  const popularDocs = [
    { id: "rental",        name: "Rental Agreement" },
    { id: "affidavit",     name: "Affidavit" },
    { id: "nda",           name: "NDA" },
    { id: "legal-notice",  name: "Legal Notice" },
    { id: "will",          name: "Will & Testament" },
    { id: "rti",           name: "RTI Application" },
    { id: "fir",           name: "FIR Application" },
    { id: "partnership",   name: "Partnership Deed" },
  ];

  return (
    <footer className="border-t border-white/10 bg-card/30 mt-24">
      {/* Newsletter strip */}
      <div className="border-b border-white/10 bg-gradient-to-r from-primary/10 via-card/40 to-primary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-1">
                Stay updated on Indian legal news
              </h3>
              <p className="text-muted-foreground text-sm">
                Subscribe and get <span className="text-primary font-semibold">10% off</span> your first document.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2 max-w-md">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-background border border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-gold flex items-center gap-2 whitespace-nowrap"
              >
                <Send className="h-4 w-4" /> Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-gold">
                <Scale className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-white">Kanoox<span className="text-primary"> AI</span></span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5 max-w-sm">
              {t(
                "India's #1 AI legal document platform. 25+ templates, 5 languages, lawyer-reviewed, 60-second drafts. Trusted by 5,000+ Indians.",
                "भारत का #1 एआई कानूनी दस्तावेज़ प्लेटफ़ॉर्म। 25+ टेम्पलेट, 5 भाषाएँ, वकील-समीक्षित, 60-सेकंड ड्राफ्ट।"
              )}
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2 mb-5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-white/10 rounded-lg text-xs text-muted-foreground">
                <Lock className="h-3 w-3 text-primary" /> SSL Secured
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-white/10 rounded-lg text-xs text-muted-foreground">
                <Shield className="h-3 w-3 text-primary" /> Razorpay Verified
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-white/10 rounded-lg text-xs text-muted-foreground">
                <Award className="h-3 w-3 text-primary" /> ISO 27001
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-2">
              {[
                { Icon: Twitter,   href: "https://twitter.com/kanooxai",   label: "Twitter" },
                { Icon: Facebook,  href: "https://facebook.com/kanooxai",  label: "Facebook" },
                { Icon: Linkedin,  href: "https://linkedin.com/company/kanooxai", label: "LinkedIn" },
                { Icon: Instagram, href: "https://instagram.com/kanooxai", label: "Instagram" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="h-9 w-9 rounded-lg bg-background border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Popular Documents */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Popular Templates</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {popularDocs.slice(0, 6).map((d) => (
                <li key={d.id}>
                  <Link href={`/documents/generate/${d.id}`} className="hover:text-primary transition-colors">
                    {d.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/documents" className="text-primary hover:text-primary/80 transition-colors font-medium">
                  View All →
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/documents" className="hover:text-primary transition-colors">Templates</Link></li>
              <li><a href="/#pricing" onClick={handlePricing} className="hover:text-primary transition-colors cursor-pointer">Pricing</a></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Legal & Help</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground mb-6">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
            <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <a href="mailto:support@kanooxai.in" className="hover:text-primary transition-colors break-all">support@kanooxai.in</a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <a href="tel:+918012345678" className="hover:text-primary transition-colors">+91 80 1234 5678</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>Bengaluru, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment + Bottom strip */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
              <span className="text-white/60 font-medium uppercase tracking-wider">We Accept:</span>
              {["UPI", "Visa", "Mastercard", "RuPay", "Net Banking", "Wallets"].map((m) => (
                <span key={m} className="px-2.5 py-1 bg-background border border-white/10 rounded text-[11px] font-medium">{m}</span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              <span>100% Secure · 7-Day Refund · 24×7 Support</span>
            </div>
          </div>

          <div className="border-t border-white/5 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              © {new Date().getFullYear()} <span className="text-white">Kanoox AI Technologies Pvt. Ltd.</span> · All rights reserved · Made with ❤️ in India
            </div>
            <div className="text-center md:text-right max-w-md">
              <strong className="text-white/70">Disclaimer:</strong> Kanoox AI is not a law firm. Documents are AI-generated drafts for informational purposes only and not a substitute for advice from a licensed advocate.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
