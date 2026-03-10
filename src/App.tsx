import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FormatProvider } from "@/contexts/FormatContext";
import { NavigationGuardProvider } from "@/contexts/NavigationGuardContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import DesktopSidebar from "@/components/DesktopSidebar";
import ScrollToTop from "@/components/ScrollToTop";
import UpdatePrompt from "@/components/UpdatePrompt";
import Dashboard from "./pages/Dashboard";
import GroupsPage from "./pages/GroupsPage";
import GroupDetail from "./pages/GroupDetail";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import FriendsPage from "./pages/FriendsPage";
import AddFriendPage from "./pages/AddFriendPage";
import ScanFriendPage from "./pages/ScanFriendPage";
import NotificationsPage from "./pages/NotificationsPage";
import SecurityPage from "./pages/SecurityPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = window.location;
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) {
    const returnPath = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(returnPath)}`} replace />;
  }
  return <>{children}</>;
};

const LoginRedirect = () => {
  const redirect = new URLSearchParams(window.location.search).get('redirect') || '/';
  return <Navigate to={redirect} replace />;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg mx-auto relative">
      <ScrollToTop />
      {user && <Header />}
      <div className={user ? 'pt-14' : ''}>
        <Routes>
          <Route path="/login" element={user ? <LoginRedirect /> : <LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
          <Route path="/add-friend" element={<ProtectedRoute><AddFriendPage /></ProtectedRoute>} />
          <Route path="/scan-friend" element={<ProtectedRoute><ScanFriendPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/security" element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {user && <BottomNav />}
      <UpdatePrompt />
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <FormatProvider>
                <NavigationGuardProvider>
                  <AppRoutes />
                </NavigationGuardProvider>
              </FormatProvider>
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
