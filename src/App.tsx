import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { useAnalytics } from "./hooks/useAnalytics";

// Page imports
import Index from "./pages/Index";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import PostEditor from "./pages/PostEditor";
import AdminUsers from "./pages/AdminUsers";
import Polls from "./pages/Polls";
import AdminPolls from "./pages/AdminPolls";
import Analytics from "./pages/Analytics";

import AdminSitemap from "./pages/AdminSitemap";
import Sitemap from "./pages/Sitemap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnalyticsWrapper = ({ children }: { children: React.ReactNode }) => {
  useAnalytics(); // Initialize analytics tracking
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsWrapper>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/polls" element={<Polls />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/new" element={<PostEditor />} />
            <Route path="/admin/edit/:id" element={<PostEditor />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/polls" element={<AdminPolls />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            
             <Route path="/admin/sitemap" element={<AdminSitemap />} />
             <Route path="/sitemap" element={<Sitemap />} />
             {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
             <Route path="*" element={<NotFound />} />
            </Routes>
          </AnalyticsWrapper>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
