import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageCircle, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";

export default function Contact() {
  useSeo({
    title: "Contact Kanoox AI — WhatsApp, Email & Phone Support for Legal Documents",
    description: "Reach Kanoox AI on WhatsApp +91 98765 43210 or email support@kanooxai.in. Mon–Sat, 10 AM – 6 PM IST. Average response under 24 hours.",
  });
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    toast({
      title: "Message sent!",
      description: "Thank you for reaching out. We'll get back to you within 24 hours.",
    });
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-white mb-3">Contact Us</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">Have a question, feedback, or need help with a document? We're here to help.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Info cards */}
            <div className="space-y-4">
              {[
                {
                  icon: Mail,
                  title: "Email Support",
                  desc: "support@kanooxai.in",
                  sub: "We respond within 24 hours",
                },
                {
                  icon: MessageCircle,
                  title: "WhatsApp",
                  desc: "+91 98765 43210",
                  sub: "Mon–Sat, 10am–6pm IST",
                },
                {
                  icon: Clock,
                  title: "Business Hours",
                  desc: "Mon – Saturday",
                  sub: "10:00 AM – 6:00 PM IST",
                },
                {
                  icon: MapPin,
                  title: "Registered Address",
                  desc: "Mumbai, Maharashtra",
                  sub: "India – 400001",
                },
              ].map((item) => (
                <div key={item.title} className="bg-card border border-white/10 rounded-2xl p-5 flex items-start gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{item.title}</p>
                    <p className="text-primary text-sm mt-0.5">{item.desc}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2 bg-card border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Name *</Label>
                    <Input
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="bg-background border-white/10 text-white focus:border-primary/50 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Email *</Label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="bg-background border-white/10 text-white focus:border-primary/50 h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white text-sm">Subject</Label>
                  <Input
                    placeholder="e.g. Issue with rent agreement generation"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="bg-background border-white/10 text-white focus:border-primary/50 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white text-sm">Message *</Label>
                  <textarea
                    rows={5}
                    placeholder="Describe your issue or question in detail..."
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full rounded-md border border-white/10 bg-background px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
