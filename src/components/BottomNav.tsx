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
    { path: "/subscription", icon: CreditCard, label: "Plan" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isDisabled = item.disabled || false;

          return isDisabled ? (
            <div
              key={item.path}
              className="flex flex-col items-center justify-center px-2 py-1 opacity-50 cursor-not-allowed min-w-[60px]"
              title="Analysis limit reached - upgrade to continue"
            >
              <div className="p-1 text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </div>
          ) : (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center px-2 py-1 transition-colors min-w-[60px] ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`${isActive ? 'bg-primary/10 text-primary rounded-full p-1.5' : 'p-1 text-muted-foreground'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
