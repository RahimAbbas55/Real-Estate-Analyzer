import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, X, Lock, Search, Trash2, FileDown, ExternalLink, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getUserSubscription, getUsageInfo } from "@/integrations/supabase/subscription";
import { formatRelativeDate } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import Layout from "@/components/Layout";

type PropertyAnalysis = Tables<"property_analysis">;

type AnalysisEntry = {
  id: string;
  createdAt: string;
  content: PropertyAnalysis;
};

const RiskGauge: React.FC<{ score: number }> = ({ score }) => {
  const clamped = Math.max(0, Math.min(100, score));
  const pct = clamped;
  const isLow = clamped <= 33;
  const isHigh = clamped >= 67;
  const level = isLow ? "Low Risk" : isHigh ? "High Risk" : "Medium Risk";
  const levelCls = isLow
    ? "text-green-600 dark:text-green-400"
    : isHigh
    ? "text-red-600 dark:text-red-400"
    : "text-amber-600 dark:text-amber-400";
  const markerColor = isLow ? "#16a34a" : isHigh ? "#dc2626" : "#d97706";
  return (
    <div className="w-full">
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold leading-none" style={{ color: markerColor }}>{clamped}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
      <div className="relative">
        <div className="h-3 rounded-full flex overflow-hidden">
          <div className="bg-green-200 dark:bg-green-900/60" style={{ width: "33.3%" }} />
          <div className="bg-amber-200 dark:bg-amber-900/60" style={{ width: "33.3%" }} />
          <div className="bg-red-200 dark:bg-red-900/60" style={{ width: "33.4%" }} />
        </div>
        <div
          className="absolute top-1/2 w-0.75 h-5 rounded-sm"
          style={{
            left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            backgroundColor: markerColor,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5 px-px">
        <span>0</span>
        <span>33</span>
        <span>66</span>
        <span>100</span>
      </div>
      <div className={`text-sm font-semibold mt-1.5 ${levelCls}`}>{level}</div>
    </div>
  );
};

const Results: React.FC = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<AnalysisEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AnalysisEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "cap_rate" | "cash_flow">("newest");
  const [filterPill, setFilterPill] = useState<"all" | "strong" | "marginal">("all");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [maoCopied, setMaoCopied] = useState(false);
  const [driveLinkEditing, setDriveLinkEditing] = useState(false);
  const [driveLinkInput, setDriveLinkInput] = useState("");

  const exportToPDF = (id: string) => {
    console.log("Export PDF for analysis:", id);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("property_analysis").delete().eq("id", id);
    setList((prev) => prev.filter((e) => e.id !== id));
    setConfirmingDeleteId(null);
  };

  const handleCopyMao = (value: unknown) => {
    const formatted = `$${formatNumber(value)}`;
    navigator.clipboard.writeText(formatted).then(() => {
      setMaoCopied(true);
      setTimeout(() => setMaoCopied(false), 1500);
    });
  };

  const saveDriveLink = async () => {
    if (!selected || !driveLinkInput.trim()) return;
    const url = driveLinkInput.trim();
    await supabase.from("property_analysis").update({ drive_link: url }).eq("id", selected.id);
    setSelected((prev) => prev ? { ...prev, content: { ...prev.content, drive_link: url } } : prev);
    setList((prev) => prev.map((e) => e.id === selected.id ? { ...e, content: { ...e.content, drive_link: url } } : e));
    setDriveLinkEditing(false);
    setDriveLinkInput("");
  };

  useEffect(() => {
    setDriveLinkEditing(false);
    setDriveLinkInput("");
  }, [selected?.id]);

  useEffect(() => {
    const loadSubscriptionInfo = async () => {
      try {
        const subscription = await getUserSubscription();
        const usage = await getUsageInfo();
        if (subscription.plan === "free" && usage.currentCount >= 3) {
          setIsLimitReached(true);
        }
        setIsEnterprise(subscription.plan === "enterprise");
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

  const getDealQualityBorderColor = (verdict: string | null): string => {
    if (!verdict) return "#6b7280";
    if (/strong deal/i.test(verdict)) return "#16a34a";
    if (/marginal deal/i.test(verdict)) return "#d97706";
    if (/avoid/i.test(verdict)) return "#dc2626";
    return "#6b7280";
  };

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

  const displayedList = useMemo(() => {
    let result = [...list];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) =>
        (e.content.property_address ?? "").toLowerCase().includes(q)
      );
    }

    if (filterPill === "strong") {
      result = result.filter((e) => Number(e.content.cap_rate ?? 0) >= 10);
    } else if (filterPill === "marginal") {
      result = result.filter((e) => {
        const cap = Number(e.content.cap_rate ?? 0);
        return cap >= 7 && cap < 10;
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "cap_rate":
          return Number(b.content.cap_rate ?? 0) - Number(a.content.cap_rate ?? 0);
        case "cash_flow":
          return Number(b.content.monthly_cash_flow ?? 0) - Number(a.content.monthly_cash_flow ?? 0);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [list, searchQuery, sortBy, filterPill]);

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

        {/* Search, Sort, and Filter Toolbar */}
        {list.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring w-56"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-border rounded-md bg-background px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="cap_rate">Highest cap rate</option>
              <option value="cash_flow">Highest cash flow</option>
            </select>

            <div className="flex items-center gap-1.5">
              {(["all", "strong", "marginal"] as const).map((pill) => (
                <button
                  key={pill}
                  onClick={() => setFilterPill(pill)}
                  className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                    filterPill === pill
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {pill === "all" ? "All" : pill === "strong" ? "Strong deals" : "Marginal"}
                </button>
              ))}
            </div>
          </div>
        )}

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
            <span className="text-6xl">📊</span>
            <h2 className="text-2xl font-semibold text-foreground">No analyses yet</h2>
            <p className="text-muted-foreground max-w-sm">
              Run your first property analysis to see cap rate, cash flow, and AI risk scores all in one place.
            </p>
            <button
              onClick={() => navigate("/analysis")}
              className="mt-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Analyze a Property Free →
            </button>
          </div>
        ) : displayedList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No analyses match your search or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedList.map((entry) => {
              const monthly = extract(entry, ["monthly_cash_flow"]) ?? 0;
              const cap = extract(entry, ["cap_rate"]) ?? 0;
              const coc = extract(entry, ["cash_on_cash_return"]) ?? 0;
              const required = extract(entry, ["required_investment"]) ?? 0;
              const address = entry.content.property_address;

              return (
                <Card
                  key={entry.id}
                  className="relative group hover:shadow-lg transition-shadow cursor-pointer"
                  style={{ borderLeft: `4px solid ${getDealQualityBorderColor(entry.content.final_verdict)}` }}
                  onClick={() => setSelected(entry)}
                >
                  {confirmingDeleteId === entry.id ? (
                    <div
                      className="absolute top-2 right-2 flex items-center gap-1 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs text-muted-foreground">Delete?</span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-xs px-2 py-0.5 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmingDeleteId(null)}
                        className="text-xs px-2 py-0.5 rounded border border-border hover:bg-muted transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingDeleteId(entry.id);
                      }}
                      aria-label="Delete analysis"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">{formatRelativeDate(entry.createdAt)}</div>
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
                    <div className="text-sm text-muted-foreground">{formatRelativeDate(selected.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isEnterprise ? (
                      <button
                        onClick={() => exportToPDF(selected.id)}
                        className="flex items-center gap-1.5 text-sm border border-border rounded px-3 py-1.5 hover:bg-muted/50 transition-colors"
                      >
                        <FileDown className="h-4 w-4" />
                        <span className="hidden sm:inline">Download PDF Report</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate("/subscription")}
                        className="flex items-center gap-1.5 text-sm border border-border rounded px-3 py-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Lock className="h-4 w-4" />
                        <span className="hidden sm:inline">Download PDF — Upgrade to Enterprise</span>
                      </button>
                    )}
                    <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {selected.content.final_verdict && (() => {
                  const verdict = selected.content.final_verdict as string;
                  const isStrong = /strong deal/i.test(verdict);
                  const isMarginal = /marginal deal/i.test(verdict);
                  const isAvoid = /avoid/i.test(verdict);
                  const icon = isStrong ? '✅' : isMarginal ? '⚠️' : '🚫';
                  const label = isStrong ? 'Strong Deal' : isMarginal ? 'Marginal Deal' : 'Avoid';
                  const borderCls = isStrong ? 'border-green-500' : isMarginal ? 'border-amber-500' : 'border-red-500';
                  const bgCls = isStrong ? 'bg-green-50 dark:bg-green-950/20' : isMarginal ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-red-50 dark:bg-red-950/20';
                  const labelCls = isStrong ? 'text-green-700 dark:text-green-400' : isMarginal ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400';
                  return (
                    <div className={`mt-4 border-l-4 ${borderCls} ${bgCls} rounded-r-lg p-4`}>
                      <div className={`flex items-center gap-2 font-semibold text-base ${labelCls}`}>
                        <span>{icon}</span>
                        <span>{label}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{verdict}</p>
                    </div>
                  );
                })()}

                {/* 2. Maximum Allowable Offer */}
                {selected.content.maximum_allowable_offer && (
                  <div className="mt-4 bg-muted/5 p-4 rounded">
                    <h4 className="font-semibold">Maximum Allowable Offer</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">${formatNumber((selected.content.maximum_allowable_offer as any)?.mao_value)}</p>
                      <button
                        onClick={() => handleCopyMao((selected.content.maximum_allowable_offer as any)?.mao_value)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
                      >
                        {maoCopied ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">{(selected.content.maximum_allowable_offer as any)?.assumptions}</p>
                  </div>
                )}

                {/* 3. Key metrics summary table */}
                <div className="mt-4 bg-muted/5 p-4 rounded">
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
                </div>

                {/* 4. AI Risk Assessment */}
                <div className="mt-4 bg-muted/5 p-4 rounded">
                  <h3 className="font-semibold mb-3">AI Risk Assessment</h3>
                  {selected.content.ai_risk_assessment ? (() => {
                    const risk = selected.content.ai_risk_assessment as Record<string, unknown>;
                    const rawScore = risk?.score;
                    const scoreNum = typeof rawScore === "number" ? rawScore : Number(rawScore);
                    return (
                      <div>
                        <RiskGauge score={isNaN(scoreNum) ? 0 : scoreNum} />
                        {risk?.explanation && (
                          <p className="text-sm text-muted-foreground mt-3">{String(risk.explanation)}</p>
                        )}
                      </div>
                    );
                  })() : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>

                <div className="mt-4 bg-muted/5 p-4 rounded">
                  <h3 className="font-semibold mb-3">Financial Breakdown</h3>
                  {selected.content.financial_breakdown ? (() => {
                    const fb = selected.content.financial_breakdown as Record<string, unknown>;
                    const monthlyIncome = Number(fb?.monthly_income ?? 0);
                    const monthlyExpenses = Number(fb?.monthly_expenses ?? 0);
                    const noi = Number(fb?.net_operating_income_monthly ?? 0);
                    const debtService = Number(fb?.debt_service ?? 0);
                    const rows = [
                      { incomeCat: "Monthly Income", incomeAmt: monthlyIncome, expenseCat: "Monthly Expenses", expenseAmt: monthlyExpenses },
                      { incomeCat: "NOI", incomeAmt: noi, expenseCat: "Debt Service", expenseAmt: debtService },
                    ];
                    return (
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                            <th className="text-left py-1.5 pr-3 font-medium">Income</th>
                            <th className="text-right py-1.5 pr-6 font-medium tabular-nums">Amount</th>
                            <th className="text-left py-1.5 pr-3 font-medium">Expense</th>
                            <th className="text-right py-1.5 font-medium tabular-nums">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr key={i} className="border-b border-border/40 last:border-0">
                              <td className="py-2 pr-3">{row.incomeCat}</td>
                              <td className={`text-right py-2 pr-6 tabular-nums ${row.incomeAmt < 0 ? "text-red-600" : ""}`}>
                                ${formatNumber(row.incomeAmt)}
                              </td>
                              <td className="py-2 pr-3">{row.expenseCat}</td>
                              <td className="text-right py-2 tabular-nums" style={{ color: "#dc2626" }}>
                                ${formatNumber(row.expenseAmt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })() : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>

                <div className="mt-4 bg-muted/5 p-4 rounded">
                  <h3 className="font-semibold mb-2">Repair Estimate</h3>
                  {selected.content.repair_estimate ? (
                    <div>
                      {(() => {
                        const re = selected.content.repair_estimate as any;
                        const low = Number(re?.total_low ?? 0);
                        const mid = Number(re?.total_mid ?? 0);
                        const high = Number(re?.total_high ?? 0);
                        const range = high - low || 1;
                        const midPct = Math.max(5, Math.min(95, ((mid - low) / range) * 100));
                        return (
                          <div className="mb-5 mt-1 select-none">
                            {/* Dollar value labels above */}
                            <div className="relative h-5 text-xs tabular-nums mb-2">
                              <span className="absolute left-0 font-medium">${formatNumber(low)}</span>
                              <span className="absolute -translate-x-1/2 font-medium" style={{ left: `${midPct}%` }}>
                                ${formatNumber(mid)}
                              </span>
                              <span className="absolute right-0 font-medium">${formatNumber(high)}</span>
                            </div>
                            {/* Bar track */}
                            <div className="relative h-2 rounded-full bg-amber-200 dark:bg-amber-900/40" style={{ overflow: 'visible' }}>
                              {/* Low dot */}
                              <div className="absolute top-1/2 w-3 h-3 rounded-full bg-amber-400" style={{ left: 0, transform: 'translate(-50%, -50%)' }} />
                              {/* Mid dot — slightly larger */}
                              <div className="absolute top-1/2 w-4 h-4 rounded-full bg-amber-500 shadow-sm" style={{ left: `${midPct}%`, transform: 'translate(-50%, -50%)' }} />
                              {/* High dot */}
                              <div className="absolute top-1/2 w-3 h-3 rounded-full bg-amber-600 dark:bg-amber-400" style={{ left: '100%', transform: 'translate(-50%, -50%)' }} />
                            </div>
                            {/* Point labels below */}
                            <div className="relative h-5 text-xs text-muted-foreground mt-1.5">
                              <span className="absolute left-0">Low</span>
                              <span className="absolute -translate-x-1/2" style={{ left: `${midPct}%` }}>Mid</span>
                              <span className="absolute right-0">High</span>
                            </div>
                          </div>
                        );
                      })()}
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
                  {selected.content.drive_link ? (
                    <div>
                      <h3 className="font-semibold mb-1">Drive Link</h3>
                      <a
                        href={selected.content.drive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <svg width="13" height="13" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
                          <path d="M43.65 25L30 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 47.5C.4 48.9 0 50.45 0 52h27z" fill="#00AC47"/>
                          <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H60.3l5.95 11.5z" fill="#EA4335"/>
                          <path d="M43.65 25L57.3 1.2C55.95.4 54.4 0 52.85 0H34.45c-1.55 0-3.1.45-4.45 1.2z" fill="#00832D"/>
                          <path d="M60.3 53H27L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h49.1c1.55 0 3.1-.45 4.45-1.2z" fill="#2684FC"/>
                          <path d="M73.4 27.5L58.85 3.15C57.5 1.75 55.9.8 54.15.8L43.65 25 60.3 53H87.3c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00"/>
                        </svg>
                        <span className="truncate max-w-55">{selected.content.drive_link}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  ) : (
                    <div>
                      {driveLinkEditing ? (
                        <>
                          <h3 className="font-semibold mb-1.5">Drive Link</h3>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={driveLinkInput}
                              onChange={(e) => setDriveLinkInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveDriveLink()}
                              placeholder="Paste Google Drive URL…"
                              autoFocus
                              className="flex-1 text-sm border border-border rounded px-2.5 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <button
                              onClick={saveDriveLink}
                              className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setDriveLinkEditing(false); setDriveLinkInput(""); }}
                              className="text-sm px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => setDriveLinkEditing(true)}
                          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          <span>Add Drive link</span>
                        </button>
                      )}
                    </div>
                  )}

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
