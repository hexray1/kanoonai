import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingSupport } from "@/components/layout/FloatingSupport";
import { UrgencyBar } from "@/components/layout/UrgencyBar";
import { ExitIntent } from "@/components/layout/ExitIntent";
import { LiveActivityToast } from "@/components/layout/LiveActivityToast";
import { StickyBottomCTA } from "@/components/layout/StickyBottomCTA";

// Lazy-loaded routes — each loads only when visited (cuts initial bundle ~60%)
const Home             = lazy(() => import("@/pages/Home"));
const Login            = lazy(() => import("@/pages/Login"));
const AuthCallback     = lazy(() => import("@/pages/AuthCallback"));
const DocumentSelection = lazy(() => import("@/pages/documents/Index"));
const GenerateDocument = lazy(() => import("@/pages/documents/Generate"));
const DocumentPreview  = lazy(() => import("@/pages/documents/Preview"));
const DownloadDocument = lazy(() => import("@/pages/documents/Download"));
const Dashboard        = lazy(() => import("@/pages/Dashboard"));
const AdminDashboard   = lazy(() => import("@/pages/admin/Dashboard"));
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

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any; adminOnly?: boolean }) {
  const { token, user } = useAuthStore();
  if (!token) {
    try {
      const path = window.location.pathname + window.location.search;
      if (path && !path.includes("/login") && !path.includes("/auth/callback")) {
        sessionStorage.setItem("kanoon_redirect_after_login", path);
      }
    } catch {}
    return <Redirect to="/login" />;
  }
  if (adminOnly && !user?.isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">This area is reserved for administrators.</p>
        <a href="/" className="text-primary hover:underline">← Back to Home</a>
      </div>
    );
  }
  return <Component />;
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
            <Route path="/login" component={Login} />
            <Route path="/auth/callback" component={AuthCallback} />
            <Route path="/documents" component={DocumentSelection} />
            {/* Public — no login required before generation */}
            <Route path="/documents/generate/:type" component={GenerateDocument} />
            <Route path="/generate/:type" component={GenerateDocument} />
            <Route path="/documents/:id/preview">
              {() => <ProtectedRoute component={DocumentPreview} />}
            </Route>
            <Route path="/documents/:id/download">
              {() => <ProtectedRoute component={DownloadDocument} />}
            </Route>
            <Route path="/dashboard">
              {() => <ProtectedRoute component={Dashboard} />}
            </Route>
            <Route path="/admin">
              {() => <ProtectedRoute component={AdminDashboard} adminOnly={true} />}
            </Route>
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
      <StickyBottomCTA />
      <ExitIntent />
      <LiveActivityToast />
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
