import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import BottomNav from "@/components/BottomNav";
import { Check, Zap, Building2 } from "lucide-react";
import { upgradeToPro, openCustomerPortal } from "@/lib/stripe";
import { getUserSubscription } from "@/integrations/supabase/subscription";
import { toast } from "sonner";

const Pricing: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentPlan = async () => {
      try {
        const subscription = await getUserSubscription();
        setCurrentPlan(subscription.plan);
      } catch (error) {
        console.error("Error loading subscription:", error);
      }
    };
    loadCurrentPlan();
  }, []);

  const handleUpgrade = async () => {
    setLoading("pro");
    try {
      await upgradeToPro();
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading("manage");
    try {
      await openCustomerPortal();
    } catch (error: any) {
      toast.error(error.message || "Failed to open subscription management");
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
      id: "pro",
      name: "Pro",
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
      buttonText: currentPlan === "pro" ? "Current Plan" : "Upgrade to Pro",
      disabled: currentPlan === "pro",
      popular: true,
    },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that fits your investment strategy
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
                      if (plan.id === "pro") handleUpgrade();
                    }}
                  >
                    {loading === plan.id ? "Loading..." : plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {currentPlan !== "free" && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={loading === "manage"}
            >
              {loading === "manage" ? "Loading..." : "Manage Subscription"}
            </Button>
          </div>
        )}
      </div>
      <BottomNav />
    </Layout>
  );
};

export default Pricing;
