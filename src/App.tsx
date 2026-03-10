import { Suspense, lazy } from 'react';
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

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const GroupsPage = lazy(() => import("./pages/GroupsPage"));
const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
const AddFriendPage = lazy(() => import("./pages/AddFriendPage"));
const ScanFriendPage = lazy(() => import("./pages/ScanFriendPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const SecurityPage = lazy(() => import("./pages/SecurityPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = window.location;
  if (loading) return <PageLoader />;
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
  if (loading) return <PageLoader />;

  return (
    <div className="relative">
      <ScrollToTop />
      {user && <DesktopSidebar />}
      <div className={user ? 'md:ml-64' : ''}>
        {user && <Header />}
        <div className={`max-w-4xl mx-auto ${user ? 'pt-14 md:pt-0' : ''}`}>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </div>
        {user && <BottomNav />}
      </div>
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
