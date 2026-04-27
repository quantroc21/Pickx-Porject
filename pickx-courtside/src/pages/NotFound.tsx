import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">PickX</p>
        <h1 className="mt-2 font-display text-6xl font-bold">404</h1>
        <p className="mb-5 mt-2 text-base text-muted-foreground">Không tìm thấy trang bạn cần.</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-glow"
        >
          Về trang chính
        </a>
      </div>
    </div>
  );
};

export default NotFound;
