import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";

interface AnalysisResults {
  monthlyCashFlow: string;
  cocRoi: string;
  capRate: string;
  requiredInvestment: string;
}

const Results = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<AnalysisResults | null>(null);

  useEffect(() => {
    const storedResults = localStorage.getItem('analysisResults');
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    } else {
      // Redirect to analysis if no results
      navigate("/analysis");
    }
  }, [navigate]);

  if (!results) {
    return null;
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
                ${results.monthlyCashFlow}
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
                {results.cocRoi}%
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
                {results.capRate}%
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
                ${results.requiredInvestment}
              </p>
              <p className="text-sm text-muted-foreground">Total upfront cost</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Results;
