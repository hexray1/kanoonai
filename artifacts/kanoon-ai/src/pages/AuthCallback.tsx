import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      toast({ title: "Login failed", description: "No token received. Please try again.", variant: "destructive" });
      setLocation("/login");
      return;
    }

    // Fetch user profile with the token
    fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          setAuth(token, data.user);
          toast({ title: `Welcome, ${data.user.name || "there"}!`, description: "You are now signed in." });
          setLocation("/dashboard");
        } else {
          throw new Error("Invalid user data");
        }
      })
      .catch(() => {
        toast({ title: "Login failed", description: "Could not load your profile.", variant: "destructive" });
        setLocation("/login");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4 text-white"
      >
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Signing you in...</p>
      </motion.div>
    </div>
  );
}
