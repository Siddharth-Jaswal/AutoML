'use client';
import { useDatasetStore } from "@/store/useDatasetStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Info, Play, CheckSquare } from "lucide-react";
import { BACKEND_URL } from "@/lib/config";
import { PlotlyChart } from "@/components/charts/PlotlyChart";

export default function CorrelationAnalysis() {
  const { summary } = useDatasetStore();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [method, setMethod] = useState<'pearson' | 'spearman'>('pearson');
  const [mode, setMode] = useState<'auto' | 'custom'>('auto');
  
  // Custom features state
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!summary) {
      router.push("/");
    }
  }, [summary, router]);

  const numericalFeatures = summary?.columns_info.filter(c => c.type.includes('int') || c.type.includes('float')).map(c => c.name) || [];

  const fetchCorrelation = async () => {
    if (!summary?.id) return;
    if (mode === 'custom' && selectedFeatures.length < 2) {
      setError("Please select at least 2 numerical features for a correlation matrix.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      let url = `${BACKEND_URL}/dataset/${summary?.id}/correlation?method=${method}`;
      if (mode === 'custom') {
        url += `&features=${encodeURIComponent(selectedFeatures.join(','))}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch correlation matrix");
      const json = await res.json();
      
      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto fetch when method changes or mode changes back to auto
  useEffect(() => {
    if (mode === 'auto') {
      fetchCorrelation();
    }
  }, [summary?.id, method, mode]);

  const toggleFeature = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  if (!summary) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 pb-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Activity className="w-8 h-8 mr-3 text-indigo-500" />
            Correlation Analysis
          </h1>
          <p className="text-muted-foreground mt-2">
            Identify linear and monotonic relationships and multicollinearity among numerical features.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center space-x-1 bg-card border border-border p-1 rounded-lg shadow-sm">
            <button 
              onClick={() => setMode('auto')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'auto' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
            >
              Auto Generate
            </button>
            <button 
              onClick={() => setMode('custom')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'custom' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
            >
              Custom Features
            </button>
          </div>
          <div className="flex items-center space-x-1 bg-card border border-border p-1 rounded-lg shadow-sm">
            <button 
              onClick={() => setMethod('pearson')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${method === 'pearson' ? 'bg-indigo-500 text-white shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
            >
              Pearson
            </button>
            <button 
              onClick={() => setMethod('spearman')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${method === 'spearman' ? 'bg-indigo-500 text-white shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
            >
              Spearman
            </button>
          </div>
        </div>
      </div>
      
      {mode === 'custom' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm shrink-0">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
            <CheckSquare className="w-4 h-4 mr-2 text-primary" />
            Select Features for Correlation
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {numericalFeatures.map(feat => (
              <button
                key={feat}
                onClick={() => toggleFeature(feat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${selectedFeatures.includes(feat) ? 'bg-primary/20 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:border-primary/50'}`}
              >
                {feat}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
             <span className="text-sm text-muted-foreground">{selectedFeatures.length} features selected</span>
             <button 
               onClick={fetchCorrelation}
               disabled={isLoading || selectedFeatures.length < 2}
               className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center disabled:opacity-50 shadow-sm"
             >
               {isLoading ? 'Computing...' : <><Play className="w-4 h-4 mr-2"/> Compute Correlation</>}
             </button>
          </div>
        </div>
      )}
      
      {error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <Info className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold text-destructive mb-2">Notice</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : isLoading || !data ? (
        <div className="flex-1 min-h-[400px] flex items-center justify-center bg-card border border-border rounded-xl">
          <div className="animate-pulse flex flex-col items-center">
            <Activity className="h-8 w-8 text-indigo-500 mb-4" />
            <p className="text-muted-foreground">Computing correlation matrix...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid lg:grid-cols-3 gap-6 overflow-hidden min-h-[500px]">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col min-h-0">
            <h3 className="text-lg font-semibold mb-4 shrink-0">Correlation Heatmap</h3>
            <div className="flex-1 min-h-0">
              <PlotlyChart 
                data={[
                  {
                    z: data.matrix,
                    x: data.columns,
                    y: data.columns,
                    type: 'heatmap',
                    colorscale: 'RdBu',
                    zmin: -1,
                    zmax: 1
                  }
                ]}
                layout={{ 
                  margin: { t: 20, r: 20, l: 120, b: 120 },
                  xaxis: { tickangle: -45 }
                }}
              />
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col min-h-0">
             <div className="shrink-0">
               <h3 className="text-lg font-semibold flex items-center">
                 <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                 High Correlations
               </h3>
               <p className="text-xs text-muted-foreground mt-1 mb-4">Pairs with correlation magnitude &gt; 0.5. These could cause multicollinearity issues.</p>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-3 pr-2">
               {data.top_pairs.length === 0 ? (
                 <div className="text-sm text-muted-foreground text-center py-10">
                   No highly correlated pairs found.
                 </div>
               ) : (
                 data.top_pairs.map((pair: any, idx: number) => (
                   <div key={idx} className="flex flex-col p-3 rounded-lg bg-muted/30 border border-border">
                     <div className="flex items-center justify-between mb-2">
                       <span className="font-medium text-foreground text-sm truncate pr-2" title={pair.feature1}>{pair.feature1}</span>
                       <span className="text-xs text-muted-foreground px-1">vs</span>
                       <span className="font-medium text-foreground text-sm truncate pl-2 text-right" title={pair.feature2}>{pair.feature2}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-xs text-muted-foreground">Score</span>
                       <span className={`font-bold text-sm ${pair.correlation > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {pair.correlation > 0 ? '+' : ''}{pair.correlation.toFixed(3)}
                       </span>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
