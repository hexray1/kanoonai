import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Scale, Globe,
  Menu, X, FileText, IndianRupee, HelpCircle, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

const NAV_LINKS = [
  { href: "/documents", labelEn: "Templates", labelHi: "टेम्पलेट्स", icon: FileText, badge: "Free" },
  { href: "/#pricing",  labelEn: "Pricing",   labelHi: "मूल्य",      icon: IndianRupee, badge: null },
  { href: "/faq",       labelEn: "FAQ",       labelHi: "प्रश्न",      icon: HelpCircle, badge: null },
  { href: "/contact",   labelEn: "Contact",   labelHi: "संपर्क",      icon: Phone, badge: null },
];

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { language, setLanguage } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location]);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("/#")) {
      const id = href.slice(2);
      if (location === "/") {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      } else {
        setLocation("/");
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } else {
      setLocation(href);
    }
  };

  const isActive = (href: string) => {
    if (href === "/documents") return location.startsWith("/documents");
    return location === href;
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-50 w-full border-b transition-all ${
          scrolled
            ? "border-white/10 bg-background/95 backdrop-blur-xl shadow-lg shadow-black/30"
            : "border-transparent bg-background/60 backdrop-blur-md"
        }`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-gold">
              <Scale className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Kanoon<span className="text-primary"> AI</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                {language === "en" ? link.labelEn : link.labelHi}
                {link.badge && (
                  <span className="absolute -top-1 -right-1 text-[9px] font-black px-1.5 py-0.5 bg-green-500 text-white rounded-full leading-none">
                    {link.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
              className="hidden lg:flex text-muted-foreground hover:text-white"
            >
              <Globe className="mr-2 h-4 w-4" />
              {language === "en" ? "हिंदी" : "English"}
            </Button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 text-white hover:bg-white/5 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-background/95 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive(link.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {language === "en" ? link.labelEn : link.labelHi}
                  </button>
                );
              })}
              <button
                onClick={() => { setLanguage(language === "en" ? "hi" : "en"); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5"
              >
                <Globe className="h-4 w-4" />
                {language === "en" ? "Switch to हिंदी" : "Switch to English"}
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
