import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuthStore } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Scale } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

import { useSeo } from "@/hooks/use-seo";

export default function Login() {
  useSeo({
    title: "Sign In with Google — Kanoox AI",
    description: "Sign in to Kanoox AI with your Google account to draft and download Indian legal documents.",
  });
  const [, setLocation] = useLocation();
  const { token } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      let redirect = "/dashboard";
      try {
        const stored = sessionStorage.getItem("kanoon_redirect_after_login");
        if (stored) {
          redirect = stored;
          sessionStorage.removeItem("kanoon_redirect_after_login");
        }
      } catch {}
      setLocation(redirect.startsWith("/") ? redirect : "/dashboard");
    }
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error === "no_google_config") {
      toast({ title: "Configuration Missing", description: "Google OAuth is not configured yet. Please contact support.", variant: "destructive", duration: 6000 });
    } else if (error === "google_denied") {
      toast({ title: "Login Cancelled", description: "You cancelled the Google sign-in.", variant: "destructive" });
    } else if (error === "server_error") {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    }
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${BASE}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-card border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-gold">
            <Scale className="h-8 w-8 text-primary" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">Welcome to Kanoox AI</h2>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          Sign in to generate professional legal documents instantly
        </p>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 h-12 px-6 bg-white text-gray-800 font-medium rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 shadow-md hover:shadow-lg border border-gray-200"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            By signing in, you agree to our{" "}
            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            Secure login
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            No password needed
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            100% private
          </span>
        </div>
      </motion.div>
    </div>
  );
}
