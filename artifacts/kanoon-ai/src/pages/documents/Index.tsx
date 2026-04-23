import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  FileText, ChevronRight, Search, TrendingUp, Star, Clock,
  Sparkles, Filter, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DOC_CATEGORIES, DOCUMENTS } from "@/lib/constants";
import { useLanguage } from "@/hooks/use-language";

const POPULAR_IDS = new Set(["rental", "affidavit", "nda", "legal-notice"]);
const NEW_IDS = new Set(["divorce-petition", "domicile-cert", "ration-card"]);

// Pseudo-realistic "users created today" counter per doc — stable per page load
function getCreatedToday(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h % 80) + 12;
}

export default function DocumentSelection() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");

  const allDocs = useMemo(() => Object.entries(DOCUMENTS), []);
  const totalDocs = allDocs.length;

  const filtered = useMemo(() => {
    return allDocs.filter(([id, doc]) => {
      if (activeCat !== "all" && doc.category !== activeCat) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.nameHi.includes(search) ||
        id.includes(q)
      );
    });
  }, [allDocs, activeCat, search]);

  const popularCount = allDocs.filter(([id]) => POPULAR_IDS.has(id)).length;

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium tracking-wider uppercase mb-5">
              <Sparkles className="h-3 w-3" /> {totalDocs} Lawyer-Reviewed Templates
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight leading-tight">
              {t("Choose your", "अपना चुनें")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200">
                legal document
              </span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-2xl mx-auto">
              {t(
                "From rental agreements to wills — every Indian legal document, drafted by AI in 60 seconds.",
                "किराये के समझौते से लेकर वसीयत तक — हर भारतीय कानूनी दस्तावेज़, 60 सेकंड में एआई द्वारा तैयार।"
              )}
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto mb-6">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t(
                  "Search 25+ templates: rental, NDA, affidavit, will, RTI...",
                  "टेम्पलेट खोजें: किराया, NDA, हलफनामा, वसीयत..."
                )}
                className="pl-14 pr-12 h-14 bg-card border-white/10 text-white text-base rounded-2xl focus:border-primary/50 shadow-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> 60s avg</span>
              <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-primary fill-primary" /> 4.9/5 rated</span>
              <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-green-400" /> 247 created today</span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0 mr-1" />
            <button
              onClick={() => setActiveCat("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCat === "all"
                  ? "bg-primary text-primary-foreground shadow-gold"
                  : "bg-card text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10"
              }`}
            >
              All ({totalDocs})
            </button>
            {DOC_CATEGORIES.map((cat) => {
              const count = allDocs.filter(([, d]) => d.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeCat === cat.id
                      ? "bg-primary text-primary-foreground shadow-gold"
                      : "bg-card text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10"
                  }`}
                >
                  {language === "en" ? cat.title : cat.titleHi} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* DOCUMENTS LIST */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-white text-lg font-medium mb-2">No templates match "{search}"</p>
            <p className="text-muted-foreground text-sm mb-6">Try a different keyword or browse all categories.</p>
            <Button onClick={() => { setSearch(""); setActiveCat("all"); }} variant="outline">
              Show All Templates
            </Button>
          </div>
        ) : activeCat !== "all" || search ? (
          // Flat grid when filtering
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(([id, doc], i) => (
              <DocCard key={id} id={id} doc={doc} index={i} language={language} t={t} />
            ))}
          </div>
        ) : (
          // Categorized view
          <>
            {/* Most Popular row */}
            {popularCount > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-white">{t("Most Popular", "सबसे लोकप्रिय")}</h2>
                  <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20 font-medium">HOT</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {allDocs.filter(([id]) => POPULAR_IDS.has(id)).map(([id, doc], i) => (
                    <DocCard key={id} id={id} doc={doc} index={i} language={language} t={t} />
                  ))}
                </div>
              </div>
            )}

            {DOC_CATEGORIES.map((category) => {
              const categoryDocs = allDocs.filter(([, d]) => d.category === category.id);
              if (!categoryDocs.length) return null;
              return (
                <div key={category.id} className="mb-12">
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <div className="w-1.5 h-7 bg-primary rounded-full"></div>
                      {language === "en" ? category.title : category.titleHi}
                    </h2>
                    <span className="text-xs text-muted-foreground">{categoryDocs.length} templates</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {categoryDocs.map(([id, doc], i) => (
                      <DocCard key={id} id={id} doc={doc} index={i} language={language} t={t} />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </section>
    </div>
  );
}

function DocCard({ id, doc, index, language, t }: any) {
  const isPopular = POPULAR_IDS.has(id);
  const isNew = NEW_IDS.has(id);
  const created = getCreatedToday(id);

  return (
    <Link href={`/documents/generate/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.04, 0.6) }}
        whileHover={{ y: -4 }}
        className="group relative cursor-pointer p-5 rounded-2xl bg-card border border-white/5 hover:border-primary/40 hover:bg-card/80 transition-all shadow-lg hover:shadow-gold h-full flex flex-col"
      >
        {/* Top row: icon + badges */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors border border-primary/10 shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {isPopular && (
              <span className="text-[10px] font-bold px-2 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20 uppercase whitespace-nowrap">
                Popular
              </span>
            )}
            {isNew && (
              <span className="text-[10px] font-bold px-2 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 uppercase whitespace-nowrap">
                New
              </span>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
          {language === "en" ? doc.name : doc.nameHi}
        </h3>

        <div className="flex items-center gap-1.5 mb-4 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3 text-green-400 shrink-0" />
          <span>{created} created today</span>
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-primary">
              ₹{doc.price}
            </span>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" /> ~60s
            </span>
          </div>
          <span className="text-primary font-medium flex items-center gap-1 text-xs">
            {t("Generate", "बनाएँ")}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
