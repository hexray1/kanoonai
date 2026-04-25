import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/hooks/use-auth";

// Components
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingSupport } from "@/components/layout/FloatingSupport";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import DocumentSelection from "@/pages/documents/Index";
import GenerateDocument from "@/pages/documents/Generate";
import DocumentPreview from "@/pages/documents/Preview";
import DownloadDocument from "@/pages/documents/Download";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Terms from "@/pages/Terms";
import RefundPolicy from "@/pages/RefundPolicy";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any; adminOnly?: boolean }) {
  const { token, user } = useAuthStore();

  if (!token) {
    // Save the page the user tried to visit, so we can return after login
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
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/auth/callback" component={AuthCallback} />

          <Route path="/documents" component={DocumentSelection} />
          <Route path="/documents/generate/:type">
            {() => <ProtectedRoute component={GenerateDocument} />}
          </Route>
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

          {/* Footer pages */}
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={Terms} />
          <Route path="/refund" component={RefundPolicy} />
          <Route path="/contact" component={Contact} />
          <Route path="/faq" component={FAQ} />

          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <FloatingSupport />
    </div>
  );
}

function App() {
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

export default App;
