import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Layout from "@/components/Layout";
import BottomNav from "@/components/BottomNav";
import { Check, Zap, Building2, Crown, ExternalLink, Loader2 } from "lucide-react";
import { upgradeToPro, upgradeToProTier, openCustomerPortal } from "@/lib/stripe";
import { getUserSubscription } from "@/integrations/supabase/subscription";
import { toast } from "sonner";

const PRICING = {
  pro:        { monthly: 15, annualMonthly: 12, annualTotal: 144 },
  enterprise: { monthly: 39, annualMonthly: 31, annualTotal: 374 },
};

const Subscription: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);

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

  const handleUpgradeProTier = async () => {
    setLoading("pro");
    try {
      await upgradeToProTier();
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
      monthlyPrice: 0,
      annualMonthlyPrice: 0,
      annualTotal: 0,
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
      monthlyPrice: PRICING.pro.monthly,
      annualMonthlyPrice: PRICING.pro.annualMonthly,
      annualTotal: PRICING.pro.annualTotal,
      period: "/month",
      description: "For growing real estate investors",
      icon: Crown,
      features: [
        "20 property analyses per month",
        "AI risk scoring",
        "PDF export",
        "Repair estimates",
        "Full cash flow & cap rate metrics",
        "Email support",
      ],
      buttonText: currentPlan === "pro" ? "Current Plan" : "Upgrade to Pro",
      disabled: currentPlan === "pro",
      mostPopular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthlyPrice: PRICING.enterprise.monthly,
      annualMonthlyPrice: PRICING.enterprise.annualMonthly,
      annualTotal: PRICING.enterprise.annualTotal,
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
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground">
            Unlock unlimited analyses and advanced features
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            aria-label="Toggle annual billing"
            className="data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600 border-2 data-[state=unchecked]:border-gray-300 dark:data-[state=unchecked]:border-gray-600"
          />
          <span className={`text-sm font-medium flex items-center gap-2 ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Annual
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;
            
            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.mostPopular ? "border-purple-500 shadow-lg" :
                  plan.popular ? "border-primary shadow-lg" : ""
                } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
              >
                {plan.mostPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
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
                    <span className="text-4xl font-bold">
                      {plan.monthlyPrice === 0
                        ? "$0"
                        : `$${isAnnual ? plan.annualMonthlyPrice : plan.monthlyPrice}`}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  {isAnnual && plan.annualTotal > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Billed as ${plan.annualTotal}/yr
                    </p>
                  )}
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
                    variant={plan.popular || plan.mostPopular ? "default" : "outline"}
                    disabled={plan.disabled || loading !== null}
                    onClick={() => {
                      if (plan.id === "enterprise") handleUpgrade();
                      else if (plan.id === "pro") handleUpgradeProTier();
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
                  {(plan.id === "pro" || plan.id === "enterprise") && !plan.disabled && (
                    <p className="flex items-center justify-center gap-1.5 flex-wrap text-[11px] text-muted-foreground pt-1">
                      <span>🔒 Secure payment</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>Cancel anytime</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>7-day money-back</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <div className="mt-14 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-1 text-center">Compare plans</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Everything you need, at the right tier.</p>
          <div className="overflow-x-auto rounded-xl border border-border shadow-sm bg-white dark:bg-card">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground bg-gray-50 dark:bg-muted/60 w-2/5 border-b border-border">Feature</th>
                  <th className="text-center px-6 py-4 font-semibold text-muted-foreground bg-gray-50 dark:bg-muted/60 border-b border-border">Free</th>
                  <th className="text-center px-6 py-4 font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 border-b-2 border-purple-400 dark:border-purple-600">
                    <span className="flex flex-col items-center gap-0.5">
                      Pro
                      <span className="text-[10px] font-semibold text-purple-500 dark:text-purple-400 tracking-widest uppercase">Most Popular</span>
                    </span>
                  </th>
                  <th className="text-center px-6 py-4 font-semibold text-primary bg-gray-50 dark:bg-muted/60 border-b border-border">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { feature: "Monthly analyses",     free: "3",      pro: "20",      enterprise: "Unlimited" },
                  { feature: "AI risk assessment",   free: false,    pro: true,      enterprise: true        },
                  { feature: "PDF export",           free: false,    pro: true,      enterprise: true        },
                  { feature: "Repair estimates",     free: false,    pro: true,      enterprise: true        },
                  { feature: "Cash flow & cap rate", free: "Basic",  pro: "Full",    enterprise: "Full"      },
                  { feature: "Customer support",     free: "Email",  pro: "Email",   enterprise: "Priority"  },
                  { feature: "Team access",          free: false,    pro: false,     enterprise: true        },
                ] as const).map((row) => {
                  const renderCell = (val: boolean | string, highlight: boolean) => {
                    if (typeof val === "boolean") {
                      return val
                        ? <span className="text-green-500 text-lg leading-none">✓</span>
                        : <span className="text-gray-300 dark:text-gray-600 text-base leading-none">—</span>;
                    }
                    return (
                      <span className={highlight ? "font-semibold text-foreground" : "text-muted-foreground"}>
                        {val}
                      </span>
                    );
                  };
                  return (
                    <tr key={row.feature} className="border-b border-gray-100 dark:border-border last:border-0 hover:bg-gray-50/80 dark:hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3.5 text-foreground font-medium">{row.feature}</td>
                      <td className="px-6 py-3.5 text-center">{renderCell(row.free as boolean | string, false)}</td>
                      <td className="px-6 py-3.5 text-center bg-purple-50 dark:bg-purple-900/30">{renderCell(row.pro as boolean | string, true)}</td>
                      <td className="px-6 py-3.5 text-center">{renderCell(row.enterprise as boolean | string, true)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <BottomNav />
    </Layout>
  );
};

export default Subscription;
