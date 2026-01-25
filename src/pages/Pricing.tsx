import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import BottomNav from "@/components/BottomNav";
import { Check, Zap, Building2, Crown, ExternalLink, Loader2 } from "lucide-react";
import { upgradeToPro, openCustomerPortal } from "@/lib/stripe";
import { getUserSubscription } from "@/integrations/supabase/subscription";
import { toast } from "sonner";

const Subscription: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const loadCurrentPlan = async () => {
      try {
        const subscription = await getUserSubscription();
        setCurrentPlan(subscription.plan);
      } catch (error) {
        console.error("Error loading subscription:", error);
      } finally {
        setPageLoading(false);
      }
    };
    loadCurrentPlan();
  }, []);

  const handleUpgrade = async () => {
    setLoading("enterprise");
    try {
      await upgradeToPro();
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
      setLoading(null);
    }
  };

  const handleManageMembership = async () => {
    setLoading("manage");
    try {
      await openCustomerPortal();
    } catch (error: any) {
      toast.error(error.message || "Failed to open membership management");
      setLoading(null);
    }
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for trying out the platform",
      icon: Zap,
      features: [
        "3 property analyses per month",
        "Basic financial metrics",
        "Email support",
      ],
      buttonText: currentPlan === "free" ? "Current Plan" : "Downgrade",
      disabled: currentPlan === "free",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$39",
      period: "/month",
      description: "For serious real estate investors",
      icon: Building2,
      features: [
        "Unlimited property analyses",
        "Advanced AI risk assessment",
        "Priority email support",
        "Detailed repair estimates",
        "Export to PDF",
        "Cash Flow & Cap Rate analysis",
        "AI-Assisted Deal Risk Insights",
      ],
      buttonText: currentPlan === "enterprise" ? "Current Plan" : "Upgrade to Enterprise",
      disabled: currentPlan === "enterprise",
      popular: true,
    },
  ];

  // Check if user is on the enterprise plan
  const isEnterprisePlan = currentPlan === "enterprise";

  // Loading state
  if (pageLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading subscription details...</p>
          </div>
        </div>
        <BottomNav />
      </Layout>
    );
  }

  // Enterprise user view - Manage Membership
  if (isEnterprisePlan) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Enterprise Membership
            </h1>
            <p className="text-muted-foreground">
              You're enjoying unlimited access to all features
            </p>
          </div>

          <Card className="border-primary/20 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Enterprise Plan
                  </CardTitle>
                  <CardDescription className="mt-1">$39/month</CardDescription>
                </div>
                <span className="bg-green-500/10 text-green-600 text-sm font-medium px-3 py-1 rounded-full">
                  Active
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <p className="text-sm text-muted-foreground font-medium">Your benefits include:</p>
                <ul className="grid gap-2">
                  {[
                    "Unlimited property analyses",
                    "Advanced AI risk assessment",
                    "Priority email support",
                    "Detailed repair estimates",
                    "Export to PDF",
                    "Cash Flow & Cap Rate analysis",
                    "AI-Assisted Deal Risk Insights",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleManageMembership}
                disabled={loading === "manage"}
              >
                {loading === "manage" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage Membership
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Update payment method, view invoices, or cancel subscription
              </p>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </Layout>
    );
  }

  // Free user view - Show plans
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground">
            Unlock unlimited analyses and advanced features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;
            
            return (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? "border-primary shadow-lg" : ""} ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Recommended
                    </span>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Current
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    disabled={plan.disabled || loading !== null}
                    onClick={() => {
                      if (plan.id === "enterprise") handleUpgrade();
                    }}
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      plan.buttonText
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </Layout>
  );
};

export default Subscription;
