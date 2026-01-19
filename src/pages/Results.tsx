import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, X, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getUserSubscription, getUsageInfo } from "@/integrations/supabase/subscription";
import BottomNav from "@/components/BottomNav";
import Layout from "@/components/Layout";

type PropertyAnalysis = Tables<"property_analysis">;

type AnalysisEntry = {
  id: string;
  createdAt: string;
  content: PropertyAnalysis;
};

const Results: React.FC = () => {
  const [list, setList] = useState<AnalysisEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AnalysisEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  useEffect(() => {
    const loadSubscriptionInfo = async () => {
      try {
        const subscription = await getUserSubscription();
        const usage = await getUsageInfo();
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

  useEffect(() => {
    const fetchAnalysisResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError("Not authenticated");
          setList([]);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("property_analysis")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("Failed to fetch analysis results:", fetchError);
          setError("Failed to load analysis results");
          setList([]);
          return;
        }

        const transformedList: AnalysisEntry[] = (data || []).map((item) => ({
          id: item.id,
          createdAt: item.created_at,
          content: item,
        }));

        setList(transformedList);
      } catch (err) {
        console.error("Error fetching analysis results:", err);
        setError("An error occurred while loading results");
        setList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisResults();
  }, []);

  const camelToSnake = (s: string) => s.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());

  const extract = (entry: AnalysisEntry, keys: (keyof PropertyAnalysis)[]): unknown => {
    for (const key of keys) {
      const val = entry.content[key];
      if (val !== null && val !== undefined) {
        return val;
      }
    }
    return undefined;
  };

  const formatNumber = (v: unknown) => {
    const n = Number(v || 0);
    if (Number.isNaN(n)) return "-";
    return n.toLocaleString();
  };

  const formatPercent = (v: unknown) => {
    const n = Number(v || 0);
    if (Number.isNaN(n)) return "-";
    return `${n.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Layout isAnalysisDisabled={isLimitReached}>
        <div className="max-w-3xl mx-auto px-4 py-8">
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
          <p className="text-muted-foreground">Loading analysis history...</p>
        </div>
        <BottomNav isAnalysisDisabled={isLimitReached} />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout isAnalysisDisabled={isLimitReached}>
        <div className="max-w-3xl mx-auto px-4 py-8">
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
          <p className="text-destructive">{error}</p>
        </div>
        <BottomNav isAnalysisDisabled={isLimitReached} />
      </Layout>
    );
  }

  return (
    <Layout isAnalysisDisabled={isLimitReached}>
      <div className="max-w-4xl mx-auto px-4 py-8">
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Analyses</h1>
            <p className="text-muted-foreground">Recent property analyses — click any item for details</p>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No analyses yet. Run an analysis to see results here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map((entry) => {
              const monthly = extract(entry, ["monthly_cash_flow"]) ?? 0;
              const cap = extract(entry, ["cap_rate"]) ?? 0;
              const coc = extract(entry, ["cash_on_cash_return"]) ?? 0;
              const required = extract(entry, ["required_investment"]) ?? 0;
              const address = entry.content.property_address;

              return (
                <Card key={entry.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelected(entry)}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</div>
                      {address && <div className="text-sm font-medium text-foreground truncate">{address}</div>}
                      <div className="text-lg font-semibold text-foreground">${formatNumber(monthly)}</div>
                      <div className="text-sm text-muted-foreground">Monthly Cash Flow</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Cap Rate</div>
                      <div className="font-semibold">{formatPercent(cap)}</div>
                      <div className="text-sm text-muted-foreground mt-2">CoC: {formatPercent(coc)}</div>
                      <div className="text-sm text-muted-foreground">Req: ${formatNumber(required)}</div>
                    </div>

                    <div className="pl-4">
                      <ChevronRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
            <div className="relative w-full max-w-3xl mx-4">
              <div className="bg-card rounded-lg p-6 shadow-xl border border-border overflow-auto max-h-[80vh]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Detailed Analysis</h2>
                    <div className="text-sm text-muted-foreground">{new Date(selected.createdAt).toLocaleString()}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/5 p-4 rounded">
                    <h3 className="font-semibold mb-2">Summary</h3>
                    {selected.content.property_address && <div className="mb-3 pb-3 border-b"><p className="font-medium text-foreground">{selected.content.property_address}</p></div>}
                    <dl className="text-sm space-y-2">
                      <div className="flex justify-between"><dt>Status</dt><dd>{String(selected.content.status ?? "saved")}</dd></div>
                      <div className="flex justify-between"><dt>Mortgage Payment</dt><dd>${formatNumber(selected.content.mortgage_payment)}</dd></div>
                      <div className="flex justify-between"><dt>Net Operating Income</dt><dd>${formatNumber(selected.content.net_operating_income)}</dd></div>
                      <div className="flex justify-between"><dt>Monthly Cash Flow</dt><dd>${formatNumber(selected.content.monthly_cash_flow)}</dd></div>
                      <div className="flex justify-between"><dt>Annual Cash Flow</dt><dd>${formatNumber(selected.content.annual_cash_flow)}</dd></div>
                      <div className="flex justify-between"><dt>Cap Rate</dt><dd>{formatPercent(selected.content.cap_rate)}</dd></div>
                      <div className="flex justify-between"><dt>Cash on Cash</dt><dd>{formatPercent(selected.content.cash_on_cash_return)}</dd></div>
                      <div className="flex justify-between"><dt>DSCR</dt><dd>{formatNumber(selected.content.dscr)}</dd></div>
                      <div className="flex justify-between"><dt>Required Investment</dt><dd>${formatNumber(selected.content.required_investment)}</dd></div>
                    </dl>
                    {selected.content.maximum_allowable_offer && (
                      <div className="mt-4">
                        <h4 className="font-semibold">Maximum Allowable Offer</h4>
                        <p className="text-sm">${formatNumber((selected.content.maximum_allowable_offer as any)?.mao_value)}</p>
                        <p className="text-sm text-muted-foreground">{(selected.content.maximum_allowable_offer as any)?.assumptions}</p>
                      </div>
                    )}
                    {selected.content.final_verdict && (
                      <div className="mt-4">
                        <h4 className="font-semibold">Final Verdict</h4>
                        <p className="text-sm">{selected.content.final_verdict}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/5 p-4 rounded">
                    <h3 className="font-semibold mb-2">AI Risk Assessment</h3>
                    {selected.content.ai_risk_assessment ? (
                      <>
                        <p className="text-sm"><strong>Score:</strong> {String((selected.content.ai_risk_assessment as Record<string, unknown>)?.score ?? "-")}</p>
                        <p className="text-sm"><strong>Level:</strong> {String((selected.content.ai_risk_assessment as Record<string, unknown>)?.level ?? "-")}</p>
                        <p className="text-sm mt-2"><strong>Explanation:</strong> {String((selected.content.ai_risk_assessment as Record<string, unknown>)?.explanation ?? "-")}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">-</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 bg-muted/5 p-4 rounded">
                  <h3 className="font-semibold mb-2">Financial Breakdown</h3>
                  {selected.content.financial_breakdown ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between"><span>Monthly Income</span><span>${formatNumber((selected.content.financial_breakdown as Record<string, unknown>)?.monthly_income ?? 0)}</span></div>
                      <div className="flex justify-between"><span>Monthly Expenses</span><span>${formatNumber((selected.content.financial_breakdown as Record<string, unknown>)?.monthly_expenses ?? 0)}</span></div>
                      <div className="flex justify-between"><span>NOI</span><span>${formatNumber((selected.content.financial_breakdown as Record<string, unknown>)?.net_operating_income_monthly ?? 0)}</span></div>
                      <div className="flex justify-between"><span>Debt Service</span><span>${formatNumber((selected.content.financial_breakdown as Record<string, unknown>)?.debt_service ?? 0)}</span></div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>

                <div className="mt-4 bg-muted/5 p-4 rounded">
                  <h3 className="font-semibold mb-2">Repair Estimate</h3>
                  {selected.content.repair_estimate ? (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mb-4">
                        <div className="flex justify-between"><span>Total Low</span><span>${formatNumber((selected.content.repair_estimate as any)?.total_low)}</span></div>
                        <div className="flex justify-between"><span>Total Mid</span><span>${formatNumber((selected.content.repair_estimate as any)?.total_mid)}</span></div>
                        <div className="flex justify-between"><span>Total High</span><span>${formatNumber((selected.content.repair_estimate as any)?.total_high)}</span></div>
                      </div>
                      <h4 className="font-semibold mb-2">Line Items</h4>
                      <div className="space-y-1">
                        {((selected.content.repair_estimate as any)?.line_items || []).map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.item}</span>
                            <span>${formatNumber(item.estimated_cost)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <div>
                    <h3 className="font-semibold">Drive Link</h3>
                    <p className="text-sm text-muted-foreground">{selected.content.drive_link ? <a href={selected.content.drive_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{selected.content.drive_link}</a> : '-'}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold">Notes</h3>
                    <p className="text-sm text-muted-foreground">{selected.content.notes ?? '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8" />
      </div>
      <BottomNav isAnalysisDisabled={isLimitReached} />
    </Layout>
  );
};

export default Results;
