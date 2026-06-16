'use client';
import { useDatasetStore } from "@/store/useDatasetStore";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { PlotlyChart } from "@/components/charts/PlotlyChart";
import { PieChart, Settings2, AlertCircle } from "lucide-react";
import { BACKEND_URL } from "@/lib/config";

const CHART_CONFIG = {
  scatter: { name: 'Scatter Plot', dims: 2, xType: 'any', yType: 'any' },
  line: { name: 'Line Plot', dims: 2, xType: 'any', yType: 'any' },
  curve: { name: 'Curve Plot (Smoothed)', dims: 2, xType: 'any', yType: 'any' },
  histogram: { name: 'Histogram / Bar Chart', dims: 1, xType: 'any', yType: 'none' },
  kde: { name: 'Distribution (KDE)', dims: 1, xType: 'numeric', yType: 'none' },
  box: { name: 'Box Plot', dims: '1_or_2', xType: 'any', yType: 'numeric' },
  violin: { name: 'Violin Plot', dims: '1_or_2', xType: 'any', yType: 'numeric' }
};

export default function VisualizationsBuilder() {
  const { summary } = useDatasetStore();
  const router = useRouter();
  
  const [plotType, setPlotType] = useState<keyof typeof CHART_CONFIG>('scatter');
  const [xColumn, setXColumn] = useState('');
  const [yColumn, setYColumn] = useState('');
  
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!summary) {
      router.push('/');
    }
  }, [summary, router]);



  // Handle configuration changes
  useEffect(() => {
    const config = CHART_CONFIG[plotType];
    if (config.dims === 1) {
      setYColumn(''); // Auto clear Y if changing to 1D plot
    }
  }, [plotType]);

  const isNumeric = (colName: string) => {
    const col = summary.columns_info.find(c => c.name === colName);
    if (!col) return false;
    return col.type.includes('int') || col.type.includes('float');
  };

  const getValidColumns = (requiredType: string) => {
    if (requiredType === 'any') return summary.columns_info;
    if (requiredType === 'numeric') return summary.columns_info.filter(c => c.type.includes('int') || c.type.includes('float'));
    return [];
  };

  const config = CHART_CONFIG[plotType];
  const isYDisabled = config.dims === 1;

  const handleGenerate = async () => {
    if (!xColumn) {
      setError("Please select at least an X-Axis feature.");
      return;
    }

    // Runtime frontend validation
    if (config.xType === 'numeric' && !isNumeric(xColumn)) {
      setError(`${config.name} requires a numerical X-Axis feature.`);
      return;
    }
    if (yColumn && config.yType === 'numeric' && !isNumeric(yColumn)) {
      setError(`${config.name} requires a numerical Y-Axis feature.`);
      return;
    }
    if (config.dims === 2 && !yColumn) {
      setError(`${config.name} requires both X and Y axis features.`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/dataset/${summary.id}/plot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plot_type: plotType,
          x_column: xColumn,
          y_column: yColumn || null
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to generate plot');
      }
      
      const resData = await res.json();
      
      // Apply curve smoothing if necessary
      let finalData = resData.data;
      if (plotType === 'curve' && finalData[0] && finalData[0].type === 'scatter') {
        finalData[0].line = { shape: 'spline', smoothing: 1.3 };
      }

      setChartData(finalData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!summary) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 pb-10 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <PieChart className="w-8 h-8 mr-3 text-primary" />
          Visualizations Builder
        </h1>
        <p className="text-muted-foreground mt-2">
          Construct on-demand charts to explore relationships. Features are dynamically filtered based on plot compatibility.
        </p>
      </div>
      
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 md:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center"><Settings2 className="w-4 h-4 mr-2"/> Chart Type</label>
          <select 
            className="w-full bg-background border border-border text-foreground text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none cursor-pointer"
            value={plotType}
            onChange={(e) => setPlotType(e.target.value as keyof typeof CHART_CONFIG)}
          >
            {Object.entries(CHART_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-foreground">
            X-Axis <span className="text-xs text-muted-foreground font-normal">({config.xType === 'numeric' ? 'Numerical' : 'Any'})</span>
          </label>
          <select 
            className="w-full bg-background border border-border text-foreground text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none cursor-pointer"
            value={xColumn}
            onChange={(e) => setXColumn(e.target.value)}
          >
            <option value="" disabled>Select X-Axis</option>
            {getValidColumns(config.xType).map(col => (
              <option key={col.name} value={col.name}>{col.name} ({col.type})</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 space-y-2">
          <label className={`text-sm font-medium ${isYDisabled ? 'text-muted-foreground' : 'text-foreground'}`}>
             Y-Axis <span className="text-xs font-normal opacity-70">({config.yType === 'numeric' ? 'Numerical' : config.dims === '1_or_2' ? 'Optional' : 'Required'})</span>
          </label>
          <select 
            className={`w-full bg-background border border-border text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none ${isYDisabled ? 'opacity-50 cursor-not-allowed text-muted-foreground' : 'text-foreground cursor-pointer'}`}
            value={yColumn}
            onChange={(e) => setYColumn(e.target.value)}
            disabled={isYDisabled}
          >
            <option value="">{config.dims === '1_or_2' ? 'None (1D Plot)' : 'Select Y-Axis'}</option>
            {getValidColumns(config.yType).map(col => (
              <option key={col.name} value={col.name}>{col.name} ({col.type})</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={handleGenerate}
          disabled={isLoading}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate Chart'}
        </button>
      </div>

      {error && (
        <div className="flex items-center text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-md border border-destructive/20 shadow-sm">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          {error}
        </div>
      )}
      
      <div className="flex-1 bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px] flex flex-col relative overflow-hidden">
        {chartData ? (
          <PlotlyChart 
            data={chartData.map((d: any) => ({ ...d, marker: { ...d.marker, color: 'hsl(221.2 83.2% 53.3%)' } }))}
            layout={{ 
              title: `${CHART_CONFIG[plotType].name.toUpperCase()}: ${xColumn} ${yColumn ? 'vs ' + yColumn : ''}`,
              margin: { t: 50, r: 20, l: 50, b: 50 },
              xaxis: { title: xColumn },
              yaxis: { title: yColumn || (plotType === 'kde' ? 'Density' : 'Value') }
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <PieChart className="w-16 h-16 opacity-20 mb-4" />
            <p>Configure your chart and click Generate</p>
          </div>
        )}
      </div>
    </div>
  );
}
