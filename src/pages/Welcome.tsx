
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
            <div className="mt-5 mx-auto w-full max-w-sm">
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-purple-400 tracking-wide uppercase">Free Plan</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    <span className={usageCount >= 3 ? "text-red-400 font-semibold" : "text-foreground font-semibold"}>{usageCount}</span>
                    <span className="text-muted-foreground"> / 3 analyses</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden" style={{ backgroundColor: "#c4b5fd" }}>
                  <div
                    style={{
                      width: `${Math.min((usageCount / 3) * 100, 100)}%`,
                      background: usageCount >= 3 ? "#ef4444" : "linear-gradient(90deg, #7c3aed, #a855f7)",
                      height: "100%",
                      borderRadius: "9999px",
                      transition: "width 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: usageCount >= 3 ? "0 0 6px rgba(239,68,68,0.5)" : "0 0 6px rgba(124,58,237,0.4)",
                    }}
                  />
                </div>
                <button
                  onClick={() => navigate("/subscription")}
                  className="mt-2.5 w-full text-center text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Upgrade for unlimited analyses →
                </button>
              </div>
            </div>
          )}
          <Button
            onClick={() => navigate(isLimitReached ? "/pricing" : "/analysis")}
            className={`mt-5 h-14 px-8 text-lg font-semibold ${isLimitReached ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}`}
            size="lg"
            disabled={isLoadingSubscription}
          >
            {isLoadingSubscription ? "Loading..." : isLimitReached ? "Upgrade to Analyze" : "Analyze a Property Free →"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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

        {/* Testimonials */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-4">What investors are saying</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                initials: "MR",
                name: "Marcus R.",
                role: "Landlord · Chicago, IL",
                quote: "I ran 11 properties through this before making an offer on my last duplex. The cap rate and cash-on-cash numbers matched what my accountant calculated — within a few dollars. Saved me a full weekend of spreadsheet work.",
              },
              {
                initials: "DP",
                name: "Danielle P.",
                role: "House Hacker · Austin, TX",
                quote: "I was skeptical of AI tools but the risk scoring actually flagged a vacancy issue I hadn't thought through. Ended up passing on that deal. Found a better one two weeks later and the numbers penciled out exactly as the report said.",
              },
              {
                initials: "JT",
                name: "James T.",
                role: "BRRRR Investor · Atlanta, GA",
                quote: "Used it to compare three properties side by side in about 20 minutes. The ROI breakdown is detailed enough that I can share it directly with my lender without reworking anything. Genuinely useful.",
              },
            ].map(({ initials, name, role, quote }) => (
              <div
                key={name}
                className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              >
                <span className="text-yellow-400 text-sm tracking-tight">★★★★★</span>
                <p className="text-sm text-foreground leading-relaxed">"{quote}"</p>
                <div className="flex items-center gap-3 mt-auto pt-1">
                  <div className="h-8 w-8 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center text-xs font-semibold shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-none mb-0.5">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
