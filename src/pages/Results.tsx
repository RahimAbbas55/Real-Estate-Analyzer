import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";

interface AnalysisResults {
  monthly_cash_flow: number;
  cash_on_cash_return: number;
  cap_rate: number;
  required_investment: number;
  ai_risk_assessment?: {
    score: number;
    level: string;
    rationale: string;
  };
  notes?: string;
}

const Results = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<AnalysisResults | null>(null);

  useEffect(() => {
    const storedResults = sessionStorage.getItem('analysisResults');
    if (storedResults) {
      try {
        const parsed = JSON.parse(storedResults);
        console.log('Loaded results:', parsed); // Debug log
        setResults(parsed);
      } catch (error) {
        console.error('Failed to parse results:', error);
      }
    } else {
      console.log('No results found in sessionStorage');
      // Optionally redirect back if no results found
      // navigate('/analysis');
    }
  }, [navigate]);

  if (!results) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Investment Analysis</h1>
          <p className="text-muted-foreground">Complete property analysis results</p>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Monthly Cash Flow
              </h3>
              <p className="text-4xl font-bold text-success mb-1">
                ${results.monthly_cash_flow?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-muted-foreground">After all expenses</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Cash-on-Cash ROI
              </h3>
              <p className="text-4xl font-bold text-foreground mb-1">
                {results.cash_on_cash_return?.toFixed(1) || '0'}%
              </p>
              <p className="text-sm text-muted-foreground">Annual return</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Cap Rate
              </h3>
              <p className="text-4xl font-bold text-foreground mb-1">
                {results.cap_rate?.toFixed(1) || '0'}%
              </p>
              <p className="text-sm text-muted-foreground">Market performance</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-destructive/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Required Investment
              </h3>
              <p className="text-4xl font-bold text-foreground mb-1">
                ${results.required_investment?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-muted-foreground">Total upfront cost</p>
            </CardContent>
          </Card>

          {/* AI Risk Assessment Card */}
          {results.ai_risk_assessment && (
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  AI Risk Assessment
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-3xl font-bold text-foreground">
                    {results.ai_risk_assessment.score}/100
                  </p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    results.ai_risk_assessment.level === 'Low Risk' 
                      ? 'bg-green-100 text-green-700' 
                      : results.ai_risk_assessment.level === 'Medium Risk'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {results.ai_risk_assessment.level}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {results.ai_risk_assessment.rationale}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes Card */}
          {results.notes && (
            <Card className="overflow-hidden border-muted">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Analysis Notes
                </h3>
                <p className="text-sm text-muted-foreground">
                  {results.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Results;