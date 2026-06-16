'use client';
import { useDatasetStore } from "@/store/useDatasetStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlotlyChart } from "@/components/charts/PlotlyChart";
import { BarChart2, PieChart, Activity, AlignLeft } from "lucide-react";
import { BACKEND_URL } from "@/lib/config";

export default function FeaturesAnalysis() {
  const { summary } = useDatasetStore();
  const router = useRouter();
  
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [featureData, setFeatureData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!summary) {
      router.push("/");
    } else if ((summary?.columns_info?.length || 0) > 0 && !selectedFeature) {
      setSelectedFeature(summary?.columns_info?.[0]?.name);
    }
  }, [summary, router, selectedFeature]);

  useEffect(() => {
    async function fetchFeature() {
      if (!summary?.id || !selectedFeature) return;
      
      setIsLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/dataset/${summary?.id}/feature/${selectedFeature}`);
        if (res.ok) {
          const data = await res.json();
          setFeatureData(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFeature();
  }, [summary?.id, selectedFeature]);

  if (!summary) return null;

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      {/* Feature Selector Sidebar */}
      <div className="w-64 flex flex-col bg-card border border-border rounded-xl overflow-hidden shrink-0 shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-foreground">Features</h3>
          <p className="text-xs text-muted-foreground mt-1">Select a column to analyze</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {summary.columns_info.map(col => (
            <button
              key={col.name}
              onClick={() => setSelectedFeature(col.name)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between
                ${selectedFeature === col.name ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}
              `}
            >
              <span className="truncate pr-2">{col.name}</span>
              <span className="text-[10px] uppercase opacity-70 shrink-0">{col.type.substring(0, 3)}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Feature Analysis Area */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
        {isLoading || !featureData ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <Activity className="h-8 w-8 text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing feature distribution...</p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
                {featureData.column_name}
                <span className="ml-4 px-2.5 py-1 text-xs rounded-md bg-secondary text-secondary-foreground font-mono">
                  {featureData.stats.type}
                </span>
              </h2>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Object.entries(featureData.stats).filter(([k]) => k !== 'type').map(([key, value]) => (
                <div key={key} className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{key.replace('_', ' ')}</span>
                  <span className="text-xl font-semibold mt-2 text-foreground truncate" title={String(value)}>
                    {value === null ? 'N/A' : typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(4)) : String(value)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Charts Area */}
            {featureData.stats.type === 'numerical' && featureData.chart_data.histogram && (
              <div className="grid md:grid-cols-2 gap-6 h-[450px]">
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center"><BarChart2 className="w-4 h-4 mr-2"/> Histogram</h3>
                  <div className="flex-1 min-h-0">
                    <PlotlyChart 
                      data={[
                        {
                          x: featureData.chart_data.histogram.bins.slice(0, -1),
                          y: featureData.chart_data.histogram.counts,
                          type: 'bar',
                          marker: { color: 'hsl(221.2 83.2% 53.3%)' } 
                        }
                      ]}
                      layout={{ margin: { t: 10, r: 10, l: 40, b: 40 } }}
                    />
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center"><AlignLeft className="w-4 h-4 mr-2"/> Box Plot</h3>
                  <div className="flex-1 min-h-0">
                    <PlotlyChart 
                      data={[
                        {
                          y: featureData.chart_data.boxplot.y,
                          type: 'box',
                          name: featureData.column_name,
                          marker: { color: 'hsl(142.1 76.2% 36.3%)' }
                        }
                      ]}
                      layout={{ margin: { t: 10, r: 10, l: 40, b: 40 } }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {featureData.stats.type === 'categorical' && featureData.chart_data.bar && (
              <div className="grid md:grid-cols-2 gap-6 h-[450px]">
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center"><BarChart2 className="w-4 h-4 mr-2"/> Value Counts (Top 20)</h3>
                  <div className="flex-1 min-h-0">
                    <PlotlyChart 
                      data={[
                        {
                          x: featureData.chart_data.bar.labels,
                          y: featureData.chart_data.bar.values,
                          type: 'bar',
                          marker: { color: 'hsl(221.2 83.2% 53.3%)' }
                        }
                      ]}
                      layout={{ margin: { t: 10, r: 10, l: 40, b: 80 } }}
                    />
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center"><PieChart className="w-4 h-4 mr-2"/> Composition</h3>
                  <div className="flex-1 min-h-0">
                    <PlotlyChart 
                      data={[
                        {
                          labels: featureData.chart_data.bar.labels,
                          values: featureData.chart_data.bar.values,
                          type: 'pie',
                          hole: 0.4,
                        }
                      ]}
                      layout={{ margin: { t: 10, r: 10, l: 10, b: 10 }, showlegend: false }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
