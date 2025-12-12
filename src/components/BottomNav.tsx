import { Home, Calculator, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Welcome" },
    { path: "/analysis", icon: Calculator, label: "Analysis" },
    { path: "/results", icon: FileText, label: "Results" },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-card/90 border border-border rounded-full px-4 py-2 z-50 shadow-lg">
      <div className="flex items-center gap-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
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
