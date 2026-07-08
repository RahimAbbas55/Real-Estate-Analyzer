import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calculator, FileText, LogOut, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Header = ({ isAnalysisDisabled = false }: { isAnalysisDisabled?: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error logging out');
    } else {
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  return (
    <header className="w-full border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/') }>
          <img 
            src="/image_assets/logo/Color logo with background.png" 
            alt="REPA Logo" 
            className="h-10 w-auto rounded-lg"
          />
          <div>
            <div className="text-sm font-semibold text-foreground">REPA</div>
            <div className="text-xs text-muted-foreground">Property analysis made simple</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-4">
          <Link to="/" className={`px-3 py-2 rounded-md ${location.pathname === '/' ? 'bg-primary/5 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Home</Link>
          {isAnalysisDisabled ? (
            <span className="px-3 py-2 rounded-md text-muted-foreground opacity-50 cursor-not-allowed" title="Analysis limit reached - upgrade to continue">Analysis</span>
          ) : (
            <Link to="/analysis" className={`px-3 py-2 rounded-md ${location.pathname === '/analysis' ? 'bg-primary/5 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Analysis</Link>
          )}
          <Link to="/results" className={`px-3 py-2 rounded-md ${location.pathname === '/results' ? 'bg-primary/5 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Results</Link>
          <Link to="/subscription" className={`px-3 py-2 rounded-md ${location.pathname === '/subscription' ? 'bg-primary/5 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
            <span className="flex items-center gap-1"><CreditCard className="w-4 h-4" />Subscription</span>
          </Link>
          <Link to="/help" className={`px-3 py-2 rounded-md ${location.pathname === '/help' ? 'bg-primary/5 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Help</Link>
          <Link to="/contact" className={`px-3 py-2 rounded-md ${location.pathname === '/contact' ? 'bg-primary/5 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Contact</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/analysis')} size="sm" disabled={isAnalysisDisabled}>New Analysis</Button>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="w-full border-t border-border bg-card mt-8">
    <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <img
          src="/image_assets/logo/Color logo - no background.png"
          alt="REPA Logo"
          className="h-6 w-auto"
        />
        <span>© {new Date().getFullYear()} REPA — Built with ❤️</span>
      </div>
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        <a href="mailto:support@repa.io" className="hover:text-foreground transition-colors">support@repa.io</a>
        <a
          href="https://linkedin.com/company/repa"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          LinkedIn
        </a>
      </div>
    </div>
  </footer>
);

const Layout: React.FC<{ children: React.ReactNode, isAnalysisDisabled?: boolean }> = ({ children, isAnalysisDisabled }) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header isAnalysisDisabled={isAnalysisDisabled} />

      <main className="max-w-6xl mx-auto px-4 py-10 pb-24 md:pb-10">
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
