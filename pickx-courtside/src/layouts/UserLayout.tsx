import { Outlet } from "react-router-dom";
import { AppHeader } from "@/components/pickx/AppHeader";
import { BottomNav } from "@/components/pickx/BottomNav";

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader subtitle="Pickleball 2v2" />
      <main className="mx-auto max-w-md px-5 pb-28 pt-4 animate-fade-in">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}