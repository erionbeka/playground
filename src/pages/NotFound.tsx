import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card/90 px-8 py-10 text-center shadow-[0_24px_70px_rgba(21,31,56,0.16)] backdrop-blur-md"
      >
        <p aria-hidden="true" className="mb-3 text-5xl">🧭</p>
        <h1 className="mb-2 font-display text-4xl font-extrabold text-foreground">404</h1>
        <p className="mb-1 text-lg text-muted-foreground">This page took a wrong turn at the slides.</p>
        <p className="mb-6 text-xs text-muted-foreground">{location.pathname}</p>

        <button
          onClick={() => navigate("/")}
          className="touch-target mb-4 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-[0_14px_36px_rgba(77,170,206,0.28)] transition hover:brightness-105"
        >
          Take me home
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate("/therapist")}
            className="touch-target rounded-xl border border-border bg-background/60 px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-foreground"
          >
            🧑‍⚕️ Therapist
          </button>
          <button
            onClick={() => navigate("/family")}
            className="touch-target rounded-xl border border-border bg-background/60 px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:border-secondary hover:text-foreground"
          >
            👪 Family
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
