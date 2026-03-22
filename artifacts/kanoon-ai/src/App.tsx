import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/hooks/use-auth";

// Components
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import DocumentSelection from "@/pages/documents/Index";
import GenerateDocument from "@/pages/documents/Generate";
import DocumentPreview from "@/pages/documents/Preview";
import DownloadDocument from "@/pages/documents/Download";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route wrapper
function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  const { token, user } = useAuthStore();
  
  if (!token) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && user?.phone !== 'admin') { // Mock admin check based on setup
    return <div className="min-h-screen bg-background flex justify-center pt-20 text-white">Access Denied. Admins only.</div>;
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

          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
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
