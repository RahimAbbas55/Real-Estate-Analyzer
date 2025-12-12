import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calculator, FileText } from 'lucide-react';
import { Button } from './ui/button';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="w-full border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/') }>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">HF</div>
          <div>
            <div className="text-sm font-semibold text-foreground">House Finder Mate</div>
            <div className="text-xs text-muted-foreground">Property analysis made simple</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-4">
          <Link to="/" className={`px-3 py-2 rounded-md ${location.pathname === '/' ? 'bg-primary/5 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Home</Link>
          <Link to="/analysis" className={`px-3 py-2 rounded-md ${location.pathname === '/analysis' ? 'bg-primary/5 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Analysis</Link>
          <Link to="/results" className={`px-3 py-2 rounded-md ${location.pathname === '/results' ? 'bg-primary/5 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Results</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/analysis')} size="sm">New Analysis</Button>
        </div>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="w-full border-t border-border bg-card mt-8">
    <div className="max-w-7xl mx-auto px-4 py-5 text-sm text-muted-foreground text-center">© {new Date().getFullYear()} House Finder Mate — Built with ❤️</div>
  </footer>
);

const Layout: React.FC<{ children: React.ReactNode } > = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
