import { Scale } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";

export function Footer() {
  const { t } = useLanguage();

  const handlePricing = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("pricing");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#pricing";
    }
  };

  return (
    <footer className="border-t border-white/10 bg-background py-12 mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-white">Kanoon<span className="text-primary">AI</span></span>
            </div>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              {t(
                "Empowering every Indian with accessible, fast, and legally sound documents powered by advanced AI.",
                "हर भारतीय को उन्नत एआई द्वारा संचालित सुलभ, तेज़ और कानूनी रूप से मजबूत दस्तावेजों के साथ सशक्त बनाना।"
              )}
            </p>
            <p className="text-muted-foreground text-xs mt-4">
              Not a law firm. Documents are AI-generated drafts for reference purposes only.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("Legal", "कानूनी")}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("Support", "समर्थन")}</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="/#pricing" onClick={handlePricing} className="hover:text-primary transition-colors cursor-pointer">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} KanoonAI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-primary transition-colors text-xs">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors text-xs">Terms</Link>
            <Link href="/contact" className="hover:text-primary transition-colors text-xs">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
