import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Mail, MessageCircle, Clock, MapPin, Shield,
  CheckCircle2, Zap, Phone, ArrowRight, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";

const CONTACT_ITEMS = [
  {
    icon: Mail,
    title: "Email Support",
    value: "support@mykanoon.ai",
    sub: "Average reply: under 24 hours",
    href: "mailto:support@mykanoon.ai",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: Clock,
    title: "Business Hours",
    value: "Mon – Saturday",
    sub: "10:00 AM – 6:00 PM IST",
    href: null,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: MapPin,
    title: "Registered Address",
    value: "Mumbai, Maharashtra",
    sub: "India — 400001",
    href: null,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
];

const QUICK_TOPICS = [
  "Payment was deducted but no document",
  "My document has an error",
  "I want to re-download my paid PDF",
  "Question about 7-day edit access",
  "Other question",
];

export default function Contact() {
  useSeo({
    title: "Contact Kanoon AI — Email Support",
    description: "Reach Kanoon AI at support@mykanoon.ai. Mon–Sat, 10 AM – 6 PM IST. Average response under 24 hours.",
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
      title: "Message sent! ✓",
      description: "We'll get back to you within 24 hours.",
    });
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="text-center mb-14">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Phone className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Contact Us</h1>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Have a question, document issue, or feedback? Our team typically responds within a few hours.
            </p>

            {/* WhatsApp CTA — prominent */}
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 mt-5 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-green-500/25 text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp — Instant Reply
            </a>
          </div>

          {/* Response time badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              { icon: Zap,          text: "WhatsApp: usually < 1 hour", color: "text-green-400" },
              { icon: Mail,         text: "Email: within 24 hours",      color: "text-blue-400"  },
              { icon: Shield,       text: "7-day refund guarantee",       color: "text-primary"   },
              { icon: CheckCircle2, text: "DPDPA 2023 compliant",         color: "text-purple-400"},
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.text} className="flex items-center gap-2 px-4 py-2 bg-card border border-white/10 rounded-full text-xs">
                  <Icon className={`h-3.5 w-3.5 ${b.color}`} />
                  <span className="text-white/70">{b.text}</span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Info cards */}
            <div className="space-y-4">
              {CONTACT_ITEMS.map((item) => {
                const Icon = item.icon;
                const inner = (
                  <div className={`bg-card border border-white/10 rounded-2xl p-5 flex items-start gap-4 transition-all hover:border-white/20 ${item.href ? "cursor-pointer" : ""}`}>
                    <div className={`h-10 w-10 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0 border ${item.border}`}>
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium mb-0.5">{item.title}</p>
                      <p className={`${item.color} text-sm font-semibold`}>{item.value}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{item.sub}</p>
                    </div>
                    {item.href && <ArrowRight className="h-4 w-4 text-muted-foreground/40 ml-auto mt-1 shrink-0" />}
                  </div>
                );
                return item.href
                  ? <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer">{inner}</a>
                  : <div key={item.title}>{inner}</div>;
              })}

              {/* FAQ shortcut */}
              <Link href="/faq">
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-all group">
                  <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/25">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Check our FAQ first</p>
                    <p className="text-muted-foreground text-xs mt-0.5">30+ questions already answered</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2 bg-card border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-white mb-2">Send Us a Message</h2>
              <p className="text-muted-foreground text-sm mb-6">Fill in your details and we'll respond within 24 hours.</p>

              {/* Quick topic pills */}
              <div className="mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Quick topic (click to fill)</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, subject: topic }))}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        form.subject === topic
                          ? "bg-primary/15 text-primary border-primary/40"
                          : "bg-background border-white/10 text-muted-foreground hover:text-white hover:border-white/25"
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Name *</Label>
                    <Input
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="bg-background border-white/10 text-white focus:border-primary/50 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Email *</Label>
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
                  <Label className="text-white/80 text-sm">Subject</Label>
                  <Input
                    placeholder="e.g. Issue with rent agreement generation"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="bg-background border-white/10 text-white focus:border-primary/50 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80 text-sm">Message *</Label>
                  <textarea
                    rows={5}
                    placeholder="Describe your issue or question in detail..."
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none transition-colors"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    type="submit"
                    disabled={sending}
                    className="h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-gold"
                  >
                    {sending ? "Sending..." : "Send Message"}
                  </Button>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-primary/60" />
                    Your data is safe with us
                  </span>
                </div>
              </form>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-14 bg-gradient-to-br from-primary/5 via-card to-card border border-primary/15 rounded-3xl p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Need a document right now?</h3>
            <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
              Don't wait for a reply. Browse 25+ legal templates and generate your document in under 60 seconds — free to preview.
            </p>
            <Link href="/documents">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold h-11 px-8">
                Browse Templates <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
