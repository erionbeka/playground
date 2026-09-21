import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { ApiAppProvider } from "@/context/ApiAppProvider";
import { useSensory } from "@/lib/sensory";
import BlobBackground from "@/components/BlobBackground";
import AdminDashboard from "@/components/admin/AdminDashboard";
import TherapistDashboard from "@/components/therapist/TherapistDashboard";
import ParentDashboard from "@/components/parent/ParentDashboard";
import Index from "./pages/Index.tsx";
import HowItWorks from "./pages/HowItWorks.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import AcceptInvite from "./pages/AcceptInvite.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();
const RuntimeAppProvider = import.meta.env.VITE_DATA_MODE === "api" ? ApiAppProvider : AppProvider;

function CalmBackdrop() {
  const { calmMode } = useSensory();
  if (calmMode) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(120,190,230,0.28),transparent_46%),radial-gradient(circle_at_82%_68%,rgba(150,210,170,0.24),transparent_52%),radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.5),transparent_60%)]"
      />
    );
  }
  return <BlobBackground />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RuntimeAppProvider>
      <TooltipProvider>
        <div className="relative min-h-screen overflow-hidden bg-background">
          <CalmBackdrop />
          <div className="relative z-10 min-h-screen">
            <Toaster />
            <Sonner />
            <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/therapist" element={<TherapistDashboard />} />
                  <Route path="/family" element={<ParentDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/reset" element={<ResetPassword />} />
                  <Route path="/accept-invite" element={<AcceptInvite />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </BrowserRouter>
          </div>
        </div>
      </TooltipProvider>
    </RuntimeAppProvider>
  </QueryClientProvider>
);

export default App;
