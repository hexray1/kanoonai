import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Scale, Globe, User, LogOut, LayoutDashboard, ShieldCheck,
  Menu, X, FileText, IndianRupee, HelpCircle, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useAuthStore } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { href: "/documents", labelEn: "Templates", labelHi: "टेम्पलेट्स", icon: FileText },
  { href: "/#pricing",  labelEn: "Pricing",   labelHi: "मूल्य",      icon: IndianRupee },
  { href: "/faq",       labelEn: "FAQ",       labelHi: "प्रश्न",      icon: HelpCircle },
  { href: "/contact",   labelEn: "Contact",   labelHi: "संपर्क",      icon: Phone },
];

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuthStore();
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

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    setLocation("/");
  };

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
              Kanoon<span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                {language === "en" ? link.labelEn : link.labelHi}
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

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 gap-2 pr-3 pl-2 h-10"
                  >
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name || "User"}
                        className="h-7 w-7 rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <span className="max-w-[100px] truncate hidden sm:inline">
                      {user.name?.split(" ")[0] || user.email?.split("@")[0] || "Account"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-white/10">
                  {(user.name || user.email) && (
                    <div className="px-3 py-2.5 border-b border-white/10">
                      <p className="text-white text-sm font-medium truncate">{user.name || ""}</p>
                      {user.email && <p className="text-muted-foreground text-xs truncate">{user.email}</p>}
                    </div>
                  )}
                  <DropdownMenuItem onClick={() => setLocation("/dashboard")} className="cursor-pointer hover:bg-white/5">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t("Dashboard", "डैशबोर्ड")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/documents")} className="cursor-pointer hover:bg-white/5">
                    <Scale className="mr-2 h-4 w-4" />
                    {t("New Document", "नया दस्तावेज़")}
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer hover:bg-white/5 text-primary">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <div className="border-t border-white/10 mt-1 pt-1">
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-red-500/10 text-red-400">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("Logout", "लॉगआउट")}
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setLocation("/login")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold h-10"
              >
                {t("Login", "लॉगिन")}
              </Button>
            )}

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
