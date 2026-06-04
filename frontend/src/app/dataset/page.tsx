'use client';
import { useDatasetStore } from "@/store/useDatasetStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Database, AlertTriangle, FileSpreadsheet, Activity, Target } from "lucide-react";
import { HealthScore } from "@/components/HealthScore";
import { DatasetTable } from "@/components/DatasetTable";

export default function DatasetOverview() {
  const { summary, setTarget } = useDatasetStore();
  const router = useRouter();

  useEffect(() => {
    if (!summary) {
      router.push("/");
    }
  }, [summary, router]);

  if (!summary) return null;

  const handleTargetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const columnName = e.target.value;
    if (!summary?.id) return;
    
    setTarget(columnName);
    
    try {
      await fetch(`http://localhost:8000/dataset/${summary.id}/target`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_column: columnName }),
      });
    } catch (error) {
      console.error("Failed to update target column:", error);
    }
  };

  // Calculate a basic health score based on missing values and duplicates
  const missingPenalty = summary.missing_percentage_total;
  const dupPenalty = (summary.duplicate_rows / summary.rows) * 100;
  const healthScore = Math.max(0, 100 - (missingPenalty * 1.5) - (dupPenalty * 2));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dataset Overview</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive breakdown of <span className="font-semibold text-foreground">{summary.filename}</span>
          </p>
        </div>
        <div className="flex items-center bg-card border border-border px-4 py-2 rounded-xl shadow-sm">
           <span className="text-sm font-medium text-muted-foreground mr-6">Overall Dataset Health</span>
           <HealthScore score={healthScore} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Rows</h3>
            <div className="p-2 bg-primary/10 rounded-lg"><Database className="h-4 w-4 text-primary" /></div>
          </div>
          <div className="text-3xl font-bold">{summary.rows.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Columns</h3>
            <div className="p-2 bg-indigo-500/10 rounded-lg"><FileSpreadsheet className="h-4 w-4 text-indigo-500" /></div>
          </div>
          <div className="text-3xl font-bold">{summary.columns.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Missing Values</h3>
            <div className="p-2 bg-yellow-500/10 rounded-lg"><AlertTriangle className="h-4 w-4 text-yellow-500" /></div>
          </div>
          <div className="text-3xl font-bold">{summary.missing_percentage_total.toFixed(2)}%</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Duplicate Rows</h3>
            <div className="p-2 bg-rose-500/10 rounded-lg"><Activity className="h-4 w-4 text-rose-500" /></div>
          </div>
          <div className="text-3xl font-bold">{summary.duplicate_rows.toLocaleString()}</div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border bg-card p-5 rounded-xl shadow-sm">
          <div>
             <h3 className="text-xl font-semibold tracking-tight">Features Dictionary</h3>
             <p className="text-sm text-muted-foreground mt-1">Review the {summary.columns} features detected in your dataset.</p>
          </div>
          <div className="flex items-center space-x-3 bg-background p-2 rounded-lg border border-border shadow-inner">
            <Target className="h-5 w-5 text-primary ml-2" />
            <span className="text-sm font-medium text-foreground whitespace-nowrap">Target Variable:</span>
            <select 
              className="bg-card border border-border text-foreground text-sm rounded-md focus:ring-primary focus:border-primary block w-48 p-2 cursor-pointer outline-none"
              value={summary.target_column || ""}
              onChange={handleTargetChange}
            >
              <option value="" disabled>Select Target Feature</option>
              {summary.columns_info.map((col) => (
                <option key={col.name} value={col.name}>{col.name}</option>
              ))}
            </select>
          </div>
        </div>
        <DatasetTable data={summary.columns_info} />
      </div>
    </div>
  );
}
