import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import { AdminAuthProvider, useAdminAuth } from "./hooks/useAdminAuth";
import { UserAuthProvider, useUserAuth } from "./hooks/useUserAuth";

import Leaderboard from "./pages/user/Leaderboard";
import LiveCourts from "./pages/user/LiveCourts";
import SearchPlayer from "./pages/user/SearchPlayer";
import PlayerProfile from "./pages/user/PlayerProfile";
import UserLogin from "./pages/user/UserLogin";

import PinGate from "./pages/admin/PinGate";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RecordMatch from "./pages/admin/RecordMatch";
import Matchmaker from "./pages/admin/Matchmaker";
import AddPlayer from "./pages/admin/AddPlayer";

import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { unlocked } = useAdminAuth();
  return unlocked ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

function MeRedirect() {
  const { userId } = useUserAuth();
  if (userId) return <Navigate to={`/player/${userId}`} replace />;
  return <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" theme="dark" richColors />
      <BrowserRouter>
        <UserAuthProvider>
          <AdminAuthProvider>
            <Routes>
            {/* User (public) */}
            <Route element={<UserLayout />}>
              <Route path="/" element={<LiveCourts />} />
              <Route path="/ranking" element={<Leaderboard />} />
              <Route path="/search" element={<SearchPlayer />} />
              <Route path="/player/:id" element={<PlayerProfile />} />
              <Route path="/login" element={<UserLogin />} />
              <Route path="/me" element={<MeRedirect />} />
            </Route>

            {/* Admin */}
            <Route path="/admin/login" element={<PinGate />} />
            <Route
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/record" element={<RecordMatch />} />
              <Route path="/admin/matchmaker" element={<Matchmaker />} />
              <Route path="/admin/players" element={<AddPlayer />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AdminAuthProvider>
        </UserAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
