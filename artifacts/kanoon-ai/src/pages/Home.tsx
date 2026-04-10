import { motion } from "framer-motion";
import { Link } from "wouter";
import { Shield, Zap, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
          >
            <img src={`${import.meta.env.BASE_URL}images/trust-badge.png`} alt="Trust" className="w-5 h-5" />
            <span className="text-sm font-medium text-primary">10,000+ Documents Generated in India</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto"
          >
            60 seconds mein apna <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200">
              legal document ready
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            {t(
              "Draft professional, legally-binding agreements, notices, and affidavits instantly using advanced AI. No lawyer required.",
              "उन्नत एआई का उपयोग करके तुरंत पेशेवर, कानूनी रूप से बाध्यकारी समझौते, नोटिस और हलफनामे तैयार करें। किसी वकील की आवश्यकता नहीं है।"
            )}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/documents">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold group">
                {t("Create Document Now", "अभी दस्तावेज़ बनाएँ")}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-lg h-14 px-8 border-white/20 text-white hover:bg-white/5"
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t("View Pricing", "मूल्य निर्धारण देखें")}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-background border border-white/5 shadow-lg">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">Generate complete, print-ready legal documents in under a minute simply by answering a few questions.</p>
            </div>
            <div className="p-6 rounded-2xl bg-background border border-white/5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Legally Sound</h3>
              <p className="text-muted-foreground">Drafts are structured based on Indian legal standards and include necessary stamp duty notices and clauses.</p>
            </div>
            <div className="p-6 rounded-2xl bg-background border border-white/5 shadow-lg">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Bilingual Output</h3>
              <p className="text-muted-foreground">Generate your documents in English, Hindi, and other regional languages instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground mb-16 max-w-2xl mx-auto">Pay per document or subscribe for unlimited access.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            <div className="p-8 rounded-3xl bg-card border border-white/10 hover:border-primary/30 transition-all">
              <h3 className="text-xl font-semibold text-white mb-2">Pay Per Doc</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="text-4xl font-bold text-white">₹99</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Single PDF Download</li>
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Standard Support</li>
              </ul>
              <Button variant="outline" className="w-full">Get Started</Button>
            </div>
            
            <div className="p-8 rounded-3xl bg-primary/5 border border-primary relative transform md:-translate-y-4 shadow-gold">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">MOST POPULAR</div>
              <h3 className="text-xl font-semibold text-white mb-2">Basic Plan</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">₹299</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-white"><CheckCircle2 className="h-5 w-5 text-primary" /> 5 Documents / month</li>
                <li className="flex items-center gap-3 text-white"><CheckCircle2 className="h-5 w-5 text-primary" /> Priority Support</li>
                <li className="flex items-center gap-3 text-white"><CheckCircle2 className="h-5 w-5 text-primary" /> Free Edits (7 days)</li>
              </ul>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Subscribe Now</Button>
            </div>

            <div className="p-8 rounded-3xl bg-card border border-white/10 hover:border-primary/30 transition-all">
              <h3 className="text-xl font-semibold text-white mb-2">Pro Plan</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">₹699</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Unlimited Documents</li>
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> Lawyer Consultation (15min)</li>
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-5 w-5 text-primary" /> API Access</li>
              </ul>
              <Button variant="outline" className="w-full">Subscribe Now</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
