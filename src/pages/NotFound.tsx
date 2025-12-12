import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center bg-card rounded-xl p-10 border border-border shadow-md">
          <h1 className="mb-4 text-6xl font-extrabold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
          <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Return to Home</a>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
