
import { Calculator, TrendingUp, Shield, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import FeatureCard from "@/components/FeatureCard";
import BottomNav from "@/components/BottomNav";
import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { getUserSubscription, getUsageInfo } from "@/integrations/supabase/subscription";

const Welcome = () => {
  const navigate = useNavigate();

  const [isLimitReached, setIsLimitReached] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("free");
  const [usageCount, setUsageCount] = useState<number>(0);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  useEffect(() => {
    const loadSubscriptionInfo = async () => {
      try {
        const subscription = await getUserSubscription();
        const usage = await getUsageInfo();
        setSubscriptionPlan(subscription.plan);
        setUsageCount(usage.currentCount);
        if (subscription.plan === "free" && usage.currentCount >= 3) {
          setIsLimitReached(true);
        }
      } catch (error) {
        // silent fail
      } finally {
        setIsLoadingSubscription(false);
      }
    };
    loadSubscriptionInfo();
  }, []);
  // console.log(usageCount , isLimitReached , subscriptionPlan);
  return (
    <Layout isAnalysisDisabled={isLimitReached}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Error box at the very top */}
        {isLimitReached && (
          <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-lg flex items-start gap-3 mb-8">
            <Lock className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive mb-1">
                Analysis Limit Reached
              </p>
              <p className="text-sm text-destructive/80">
                You've reached the maximum of 3 analyses per month on the Free plan. Please upgrade to Pro or Enterprise for unlimited analyses.
              </p>
            </div>
          </div>
        )}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3 leading-tight">
            <span className="bg-clip-text text-transparent bg-linear-to-r from-primary to-purple-500">Real Estate Property Analyzer</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Get instant investment analysis in minutes
          </p>
          {!isLoadingSubscription && subscriptionPlan === "free" && (
            <p className="text-sm text-muted-foreground mt-3">
              Free Plan: {usageCount}/3 analyses used this month
            </p>
          )}
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
          onClick={() => navigate(isLimitReached ? "/pricing" : "/analysis")}
          className={`w-full h-14 text-lg font-semibold ${isLimitReached ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}`}
          size="lg"
          disabled={isLoadingSubscription}
        >
          {isLoadingSubscription
            ? "Loading..."
            : isLimitReached
            ? "Upgrade to Analyze"
            : "Start Analysis"}
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

      <BottomNav isAnalysisDisabled={isLimitReached} />
    </Layout>
  );
};

export default Welcome;
