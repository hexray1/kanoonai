import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, FileText, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-xl relative z-10"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="text-8xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-primary via-yellow-300 to-primary/40 mb-2 tracking-tighter"
        >
          404
        </motion.div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to drafting your legal document.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link href="/">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Button>
          </Link>
          <Link href="/documents">
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4" />
              Browse Templates
            </Button>
          </Link>
        </div>

        <div className="border-t border-white/10 pt-8">
          <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">
            Popular Pages
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { href: "/documents", label: "All Templates" },
              { href: "/#pricing", label: "Pricing" },
              { href: "/faq", label: "FAQ" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <Link key={link.href} href={link.href}>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-card border border-white/10 text-muted-foreground hover:border-primary/40 hover:text-primary cursor-pointer transition-all">
                  <Search className="h-3 w-3" />
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <button
          onClick={() => window.history.back()}
          className="mt-8 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Go back
        </button>
      </motion.div>
    </div>
  );
}
