import { Scale } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="border-t border-white/10 bg-background py-12 mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-white">Kanoon<span className="text-primary">AI</span></span>
            </div>
            <p className="text-muted-foreground max-w-sm">
              {t("Empowering every Indian with accessible, fast, and legally sound documents powered by advanced AI.", "हर भारतीय को उन्नत एआई द्वारा संचालित सुलभ, तेज़ और कानूनी रूप से मजबूत दस्तावेजों के साथ सशक्त बनाना।")}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t("Legal", "कानूनी")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Refund Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t("Support", "समर्थन")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} LegalAI Bharat. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
