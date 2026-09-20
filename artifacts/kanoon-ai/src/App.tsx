import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingSupport } from "@/components/layout/FloatingSupport";
import { UrgencyBar } from "@/components/layout/UrgencyBar";
import { ExitIntent } from "@/components/layout/ExitIntent";

// Lazy-loaded routes — each loads only when visited (cuts initial bundle ~60%)
const Home             = lazy(() => import("@/pages/Home"));
const DocumentSelection = lazy(() => import("@/pages/documents/Index"));
const GenerateDocument = lazy(() => import("@/pages/documents/Generate"));
const PrivacyPolicy    = lazy(() => import("@/pages/PrivacyPolicy"));
const Terms            = lazy(() => import("@/pages/Terms"));
const RefundPolicy     = lazy(() => import("@/pages/RefundPolicy"));
const Contact          = lazy(() => import("@/pages/Contact"));
const FAQ              = lazy(() => import("@/pages/FAQ"));
const DocumentPage     = lazy(() => import("@/pages/seo/DocumentPage"));
const NotFound         = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <UrgencyBar />
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/documents" component={DocumentSelection} />
            {/* Guest-only flow: generation, payment and PDF delivery require no account. */}
            <Route path="/documents/generate/:type" component={GenerateDocument} />
            <Route path="/generate/:type" component={GenerateDocument} />
            <Route path="/privacy" component={PrivacyPolicy} />
            <Route path="/terms" component={Terms} />
            <Route path="/refund" component={RefundPolicy} />
            <Route path="/contact" component={Contact} />
            <Route path="/faq" component={FAQ} />
            {/* Programmatic SEO pages: /legal/:docSlug and /legal/:docSlug/:city */}
            <Route path="/legal/:docSlug/:location" component={DocumentPage} />
            <Route path="/legal/:docSlug" component={DocumentPage} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
      <FloatingSupport />
      <ExitIntent />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
