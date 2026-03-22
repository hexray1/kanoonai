import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useSendOtp, useVerifyOtp } from "@workspace/api-client-react";
import { useAuthStore } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Scale, Loader2 } from "lucide-react";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [, setLocation] = useLocation();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast({ title: "Invalid Phone", description: "Please enter a valid 10-digit number", variant: "destructive" });
      return;
    }
    
    try {
      const res = await sendOtpMutation.mutateAsync({ data: { phone } });
      setStep(2);
      toast({ 
        title: "OTP Sent", 
        description: res.devOtp ? `DEV MODE: Your OTP is ${res.devOtp}` : "Please check your SMS",
        duration: 5000 
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send OTP", variant: "destructive" });
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await verifyOtpMutation.mutateAsync({ data: { phone, otp } });
      setAuth(res.token, res.user);
      toast({ title: "Welcome to KanoonAI!", description: "Successfully logged in." });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: "Invalid OTP. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-gold">
            <Scale className="h-8 w-8 text-primary" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h2>
        <p className="text-muted-foreground text-center mb-8">Login with your phone number. No password required.</p>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">Phone Number</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">+91</span>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="9876543210" 
                  className="pl-12 h-12 bg-background border-white/10 focus:border-primary/50 text-white"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={sendOtpMutation.isPending}
            >
              {sendOtpMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Get OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-white">Enter OTP</Label>
              <Input 
                id="otp" 
                type="text" 
                placeholder="000000" 
                className="h-12 text-center text-2xl tracking-widest bg-background border-white/10 focus:border-primary/50 text-white"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={verifyOtpMutation.isPending}
            >
              {verifyOtpMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify & Login"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-muted-foreground hover:text-white"
              onClick={() => setStep(1)}
            >
              Change Phone Number
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
