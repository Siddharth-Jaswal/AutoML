'use client';
import { useDatasetStore } from "@/store/useDatasetStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Activity, Database, ArrowRight } from "lucide-react";
import { BACKEND_URL } from "@/lib/config";
import { PlotlyChart } from "@/components/charts/PlotlyChart";
import Link from "next/link";

export default function MissingValues() {
  const { summary } = useDatasetStore();
  const router = useRouter();
  
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!summary) {
      router.push("/");
      return;
    }
    
    async function fetchMissingReport() {
      setIsLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/dataset/${summary?.id}/missing`);
        if (!res.ok) throw new Error("Failed to fetch missing values report");
        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMissingReport();
  }, [summary, router]);

  if (!summary) return null;

  if (isLoading || !report) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="h-8 w-8 text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing missing values...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <AlertTriangle className="w-8 h-8 mr-3 text-yellow-500" />
          Missing Values Analysis
        </h1>
        <p className="text-muted-foreground mt-2">
          Identify and understand data gaps across your dataset features.
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Overall Missing Cells</h3>
          <div className="text-3xl font-bold mt-2 text-foreground">
            {report.overall_missing_percentage.toFixed(2)}%
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Rows with Missing Data</h3>
          <div className="text-3xl font-bold mt-2 text-foreground">
            {report.rows_with_missing.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/ {report.total_rows.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Impacted Rows %</h3>
          <div className="text-3xl font-bold mt-2 text-foreground">
            {report.rows_missing_percentage.toFixed(2)}%
          </div>
        </div>
      </div>
      
      {report.missing_columns.length === 0 ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <Database className="w-12 h-12 text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-green-500 mb-2">Perfect Data Quality!</h2>
          <p className="text-muted-foreground max-w-md">There are absolutely no missing values in any of your dataset's features.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px] flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Missing Percentage by Feature</h3>
            <div className="flex-1 min-h-[300px]">
              <PlotlyChart 
                data={[
                  {
                    x: report.missing_columns.map((c: any) => c.column),
                    y: report.missing_columns.map((c: any) => c.percentage),
                    type: 'bar',
                    marker: { color: 'hsl(47.9 95.8% 53.1%)' } // yellow-500 equivalent
                  }
                ]}
                layout={{ 
                  margin: { t: 20, r: 20, l: 50, b: 80 },
                  yaxis: { title: 'Missing (%)', range: [0, 100] }
                }}
              />
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
             <h3 className="text-lg font-semibold mb-4">Impacted Features</h3>
             <div className="flex-1 overflow-y-auto space-y-3 pr-2">
               {report.missing_columns.map((col: any) => (
                 <div key={col.column} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                   <div>
                     <span className="font-semibold text-foreground block">{col.column}</span>
                     <span className="text-xs text-muted-foreground">{col.count.toLocaleString()} rows missing</span>
                   </div>
                   <div className="text-right">
                     <span className="font-bold text-yellow-500">{col.percentage.toFixed(1)}%</span>
                   </div>
                 </div>
               ))}
             </div>
             <div className="mt-4 pt-4 border-t border-border shrink-0">
               <Link href="/preprocessing" className="w-full flex items-center justify-center px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                 Handle Missing Values <ArrowRight className="w-4 h-4 ml-2" />
               </Link>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
