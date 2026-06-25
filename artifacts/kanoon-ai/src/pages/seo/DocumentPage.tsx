// Programmatic SEO page — one page per document type + city/state
// Routes: /legal/:docSlug, /legal/:docSlug/:location
import { useParams } from "wouter";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Star, Shield, Zap, Clock, Globe,
  FileText, IndianRupee, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCUMENTS } from "@/lib/constants";
import { useSeo } from "@/hooks/use-seo";

const CITY_STATES: Record<string, string> = {
  mumbai: "Maharashtra", delhi: "Delhi", bengaluru: "Karnataka",
  hyderabad: "Telangana", chennai: "Tamil Nadu", kolkata: "West Bengal",
  pune: "Maharashtra", ahmedabad: "Gujarat", jaipur: "Rajasthan",
  lucknow: "Uttar Pradesh", surat: "Gujarat", chandigarh: "Punjab",
  kochi: "Kerala", nagpur: "Maharashtra", indore: "Madhya Pradesh",
  bhopal: "Madhya Pradesh", patna: "Bihar", ranchi: "Jharkhand",
  bhubaneswar: "Odisha", guwahati: "Assam", visakhapatnam: "Andhra Pradesh",
};

function titleCase(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const CITY_FAQS: Record<string, Record<string, string[]>> = {
  "rent-agreement": {
    mumbai:    ["What is the stamp duty for a rent agreement in Mumbai?", "Is a 11-month rent agreement valid in Mumbai?", "Can I register a rent agreement online in Maharashtra?"],
    delhi:     ["What is the minimum rent agreement duration in Delhi?", "Is notarization of rent agreement mandatory in Delhi?", "What is the stamp duty for rent agreement in Delhi?"],
    bengaluru: ["What is the stamp duty for rent agreement in Bangalore?", "Is 11-month rent agreement valid in Karnataka?", "How to register a rental agreement online in Bangalore?"],
    _default:  ["Is a rent agreement legally valid in India?", "What should a rent agreement include?", "How long is a rent agreement valid without registration?"],
  },
};

export default function DocumentPage() {
  const { docSlug, location } = useParams<{ docSlug: string; location?: string }>();
  const docConfig = DOCUMENTS[docSlug as keyof typeof DOCUMENTS];

  const cityName   = location ? titleCase(location) : null;
  const stateName  = location ? (CITY_STATES[location.toLowerCase()] ?? titleCase(location)) : null;
  const docTitle   = docConfig?.name ?? titleCase(docSlug ?? "");

  const pageTitle  = cityName
    ? `${docTitle} in ${cityName} | Online, Instant, ₹${docConfig?.price ?? 99}`
    : `${docTitle} Online India | AI-Generated, Lawyer-Reviewed`;
  const pageDesc   = cityName
    ? `Create a ${docTitle} for ${cityName}, ${stateName} online in 60 seconds with NVIDIA AI. Compliant with ${stateName} laws. Free preview. ₹${docConfig?.price ?? 99} to download.`
    : `Create a ${docTitle} online in India instantly. NVIDIA AI-powered. Lawyer-reviewed. 5 languages. Free draft & preview. Pay ₹${docConfig?.price ?? 99} to download.`;

  useSeo({ title: pageTitle, description: pageDesc });

  const faqs = (CITY_FAQS[docSlug ?? ""]?.[location ?? "_default"] ?? CITY_FAQS[docSlug ?? ""]?._default) ?? [
    `Is a ${docTitle} legally valid in India?`,
    `How long does it take to generate a ${docTitle} online?`,
    `What information is needed to create a ${docTitle}?`,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            {cityName && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-medium mb-5">
                📍 {cityName}, {stateName}
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
              {cityName ? (
                <>{docTitle} in {cityName}<br /><span className="text-primary">Online — Ready in 60 Seconds</span></>
              ) : (
                <>{docTitle} Online<br /><span className="text-primary">AI-Generated · Lawyer-Reviewed</span></>
              )}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              {cityName
                ? `Create a legally valid ${docTitle} for ${cityName} in minutes using NVIDIA AI. Compliant with ${stateName} laws. No lawyer needed.`
                : `India's most trusted AI tool to generate a complete, legally sound ${docTitle} in under 60 seconds. Used by 12,000+ Indians.`}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={docConfig ? `/documents/generate/${docSlug}` : "/documents"}>
                <Button size="lg" className="h-14 px-10 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold font-bold group">
                  Generate {docTitle} Now — ₹{docConfig?.price ?? 99}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-primary mt-3 font-medium">
              ✦ Free to draft & preview · Pay ₹{docConfig?.price ?? 99} to download PDF ✦
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Zap,          label: "60-Second Generation" },
              { icon: Shield,       label: "Lawyer-Reviewed Template" },
              { icon: Globe,        label: "5 Indian Languages" },
              { icon: IndianRupee,  label: `From ₹${docConfig?.price ?? 99}` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 p-4 bg-card border border-white/10 rounded-xl text-center">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-white font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-16 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            What's included in your {docTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              `All mandatory clauses per Indian law (${stateName ?? "applicable state"} + central)`,
              "Parties section with full legal names and addresses",
              "Financial terms: amounts, due dates, and penalties",
              "Termination, notice period, and dispute resolution",
              "Witness and attestation blocks",
              "Stamp duty advisory and registration guidance",
              "Professional formatting ready for print",
              "NVIDIA AI-verified legal language",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-white/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to generate */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-white mb-10 text-center">
            How to create a {docTitle}{cityName ? ` in ${cityName}` : ""} in 3 steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: "1", title: "Fill the form",    desc: "Answer simple questions about the parties, amounts, and duration. No legal knowledge needed." },
              { n: "2", title: "AI drafts it live", desc: "Watch NVIDIA AI write your complete, legally sound document in real-time — under 60 seconds." },
              { n: "3", title: "Preview free, pay to download", desc: `Preview your full ${docTitle} for free. Pay ₹${docConfig?.price ?? 99} to download the professional PDF.` },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-gold">{s.n}</div>
                <h3 className="text-white font-bold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href={docConfig ? `/documents/generate/${docSlug}` : "/documents"}>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold h-12 px-8 font-bold">
                Start Now — Free Preview <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* City-specific FAQ */}
      <section className="py-16 bg-card/30 border-y border-white/5 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            {cityName ? `${docTitle} — ${cityName} FAQ` : `${docTitle} FAQ`}
          </h2>
          <div className="space-y-4">
            {faqs.map((q, i) => (
              <div key={i} className="p-5 bg-card border border-white/10 rounded-2xl">
                <p className="text-white font-medium mb-2">{q}</p>
                <p className="text-muted-foreground text-sm">
                  Kanoox AI generates {docTitle.toLowerCase()}s that comply with all applicable Indian laws
                  {stateName ? ` including ${stateName} specific regulations` : ""}. 
                  Our NVIDIA AI includes the correct legal clauses, stamp duty guidance, and jurisdiction provisions automatically.{" "}
                  <Link href="/faq" className="text-primary hover:underline">Read full FAQ →</Link>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-black text-white mb-4">
            Create your {docTitle}{cityName ? ` for ${cityName}` : ""} now
          </h2>
          <p className="text-muted-foreground mb-8">
            Trusted by 12,000+ Indians · 4.9★ rating · 7-day refund guarantee
          </p>
          <div className="flex items-center justify-center gap-2 mb-6">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-primary fill-primary" />)}
            <span className="text-white font-medium ml-1">4.9 / 5</span>
          </div>
          <Link href={docConfig ? `/documents/generate/${docSlug}` : "/documents"}>
            <Button size="lg" className="h-14 px-10 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold font-bold">
              Generate {docTitle} — ₹{docConfig?.price ?? 99}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-3">Free to draft & preview · Pay only to download</p>
        </div>
      </section>
    </div>
  );
}
