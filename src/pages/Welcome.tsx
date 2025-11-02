import { Calculator, TrendingUp, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import FeatureCard from "@/components/FeatureCard";
import BottomNav from "@/components/BottomNav";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Real Estate Property Analyzer
          </h1>
          <p className="text-xl text-muted-foreground">
            Get instant investment analysis in minutes
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <FeatureCard
            icon={Calculator}
            title="Instant Analysis"
            description="Get comprehensive investment metrics including cash flow, ROI, and cap rate"
            iconColor="bg-primary/10 text-primary"
          />

          <FeatureCard
            icon={TrendingUp}
            title="AI Risk Assessment"
            description="Advanced algorithms analyze market conditions and investment risks"
            iconColor="bg-success/10 text-success"
          />

          <FeatureCard
            icon={Shield}
            title="Secure Upload"
            description="Upload property photos, documents, and videos with enterprise-grade security"
            iconColor="bg-destructive/10 text-destructive"
          />

          <FeatureCard
            icon={Clock}
            title="Quick Results"
            description="Complete analysis in under 5 minutes with downloadable PDF reports"
            iconColor="bg-purple-500/10 text-purple-500"
          />
        </div>

        <Button
          onClick={() => navigate("/analysis")}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          Start Analysis
        </Button>

        <div className="mt-8 bg-card rounded-xl p-6 border border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary mb-1">10K+</p>
              <p className="text-sm text-muted-foreground">Properties Analyzed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary mb-1">95%</p>
              <p className="text-sm text-muted-foreground">Accuracy Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary mb-1">2min</p>
              <p className="text-sm text-muted-foreground">Avg. Analysis Time</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Welcome;
