import { Link, useLocation } from "wouter";
import { Scale, Globe, User, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useAuthStore } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [, setLocation] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scale className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Kanoon<span className="text-primary">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "hi" : "en")}
            className="hidden sm:flex text-muted-foreground hover:text-white"
          >
            <Globe className="mr-2 h-4 w-4" />
            {language === "en" ? "हिंदी" : "English"}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 gap-2 pr-4"
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name || "User"}
                      className="h-6 w-6 rounded-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="max-w-[120px] truncate">
                    {user.name?.split(" ")[0] || user.email?.split("@")[0] || "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card border-border">
                {(user.name || user.email) && (
                  <div className="px-3 py-2 border-b border-white/10">
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
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-400 focus:text-red-400 hover:bg-red-400/10 mt-1 border-t border-white/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("Logout", "लॉग आउट")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => setLocation("/login")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold"
            >
              {t("Login", "लॉग इन")}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
