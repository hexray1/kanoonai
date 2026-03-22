import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { FileText, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DOC_CATEGORIES, DOCUMENTS } from "@/lib/constants";
import { useLanguage } from "@/hooks/use-language";

export default function DocumentSelection() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");

  const filteredDocs = Object.entries(DOCUMENTS).filter(([id, doc]) => 
    doc.name.toLowerCase().includes(search.toLowerCase()) || 
    doc.nameHi.includes(search)
  );

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            {t("Select Document Type", "दस्तावेज़ का प्रकार चुनें")}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t("Choose from our legally vetted templates for every situation.", "हर स्थिति के लिए हमारे कानूनी रूप से जांचे गए टेम्पलेट में से चुनें।")}
          </p>
          
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder={t("Search documents...", "दस्तावेज़ खोजें...")}
              className="pl-12 h-14 bg-card border-white/10 text-white text-lg rounded-full focus:border-primary/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {DOC_CATEGORIES.map(category => {
          const categoryDocs = filteredDocs.filter(([, doc]) => doc.category === category.id);
          if (categoryDocs.length === 0) return null;

          return (
            <div key={category.id} className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10 flex items-center gap-2">
                <div className="w-2 h-6 bg-primary rounded-full"></div>
                {language === 'en' ? category.title : category.titleHi}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryDocs.map(([id, doc], index) => (
                  <Link key={id} href={`/documents/generate/${id}`}>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group cursor-pointer p-6 rounded-2xl bg-card border border-white/5 hover:border-primary/40 hover:bg-card/80 transition-all shadow-lg hover:shadow-gold"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                          ₹{doc.price}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-primary transition-colors">
                        {language === 'en' ? doc.name : doc.nameHi}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-4 group-hover:text-white transition-colors">
                        <span>{t("Generate Now", "अभी बनाएँ")}</span>
                        <ChevronRight className="h-4 w-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
