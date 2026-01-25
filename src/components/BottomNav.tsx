import { Home, Calculator, FileText, CreditCard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getUsageInfo, getUserSubscription } from "@/integrations/supabase/subscription";


const BottomNav = ({ isAnalysisDisabled = false }: { isAnalysisDisabled?: boolean }) => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/analysis", icon: Calculator, label: "Analysis", disabled: isAnalysisDisabled },
    { path: "/results", icon: FileText, label: "Results" },
    { path: "/pricing", icon: CreditCard, label: "Pricing" },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-card/90 border border-border rounded-full px-4 py-2 z-50 shadow-lg">
      <div className="flex items-center gap-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isDisabled = item.disabled || false;

          return isDisabled ? (
            <div
              key={item.path}
              className="flex flex-col items-center justify-center px-3 py-1 rounded-lg opacity-50 cursor-not-allowed"
              title="Analysis limit reached - upgrade to continue"
            >
              <div className="p-1 text-muted-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium mt-1">{item.label}</span>
            </div>
          ) : (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`${isActive ? 'bg-primary/10 text-primary rounded-full p-2' : 'p-1 text-muted-foreground'}`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
