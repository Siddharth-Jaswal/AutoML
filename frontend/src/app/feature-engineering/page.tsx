'use client';
import { useDatasetStore } from "@/store/useDatasetStore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Settings, Play, Plus, Trash2, GitPullRequest } from "lucide-react";
import { BACKEND_URL } from "@/lib/config";

type FEOperation = {
  id: string;
  type: string;
  column?: string;
  column1?: string;
  column2?: string;
  operation?: string;
  new_column_name?: string;
  bins?: number;
  strategy?: string;
  degree?: number;
};

const FE_OPS = ["LogTransform", "Mathematical", "Binning", "Polynomial"];

export default function FeatureEngineering() {
  const { summary, setSummary, feOperations: pipeline, setFeOperations: setPipeline } = useDatasetStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!summary) {
      router.push('/');
    }
  }, [summary, router]);

  if (!summary) return null;



  const numericalFeatures = summary.columns_info.filter(c => c.type.includes('int') || c.type.includes('float')).map(c => c.name);

  const addOperation = () => {
    setPipeline([...pipeline, { id: Date.now().toString(), type: "LogTransform", column: numericalFeatures[0] }]);
  };

  const removeOperation = (id: string) => {
    setPipeline(pipeline.filter(p => p.id !== id));
  };

  const updateOperation = (id: string, updates: Partial<FEOperation>) => {
    setPipeline(pipeline.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const applyPipeline = async () => {
    if (pipeline.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      const res = await fetch(`${BACKEND_URL}/dataset/${summary?.id}/feature-engineering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: pipeline })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to apply feature engineering');
      }
      
      const newSummary = await res.json();
      setSummary(newSummary);
      setSuccessMsg("Feature engineering applied successfully! Dataset updated.");
      setPipeline([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 pb-10 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <GitPullRequest className="w-8 h-8 mr-3 text-emerald-500" />
          Feature Engineering
        </h1>
        <p className="text-muted-foreground mt-2">
          Create powerful new predictive signals by transforming or combining existing features.
        </p>
      </div>
      
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Settings className="w-5 h-5 mr-2 text-primary" />
            Engineering Pipeline
          </h2>
          <button 
            onClick={addOperation}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors shadow-sm flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Step
          </button>
        </div>
        
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {pipeline.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
              <GitPullRequest className="w-16 h-16 mb-4" />
              <p>Your pipeline is empty.</p>
              <p className="text-sm">Click 'Add Step' to start engineering new features.</p>
            </div>
          ) : (
            pipeline.map((step, idx) => (
              <div key={step.id} className="relative flex items-start gap-4 p-4 border border-border rounded-lg bg-background group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Operation</label>
                    <select 
                      className="w-full bg-muted border border-transparent text-sm rounded-md p-2 outline-none focus:border-primary focus:bg-background transition-colors cursor-pointer"
                      value={step.type}
                      onChange={(e) => updateOperation(step.id, { type: e.target.value })}
                    >
                      {FE_OPS.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>

                  {step.type === "Mathematical" ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Column 1</label>
                        <select 
                          className="w-full bg-muted border border-transparent text-sm rounded-md p-2 outline-none cursor-pointer"
                          value={step.column1 || ''}
                          onChange={(e) => updateOperation(step.id, { column1: e.target.value })}
                        >
                          <option value="" disabled>Select Col 1</option>
                          {numericalFeatures.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Operation (+, -, *, /)</label>
                        <select 
                          className="w-full bg-muted border border-transparent text-sm rounded-md p-2 outline-none cursor-pointer"
                          value={step.operation || ''}
                          onChange={(e) => updateOperation(step.id, { operation: e.target.value })}
                        >
                          <option value="" disabled>Select Op</option>
                          <option value="add">Add (+)</option>
                          <option value="sub">Subtract (-)</option>
                          <option value="mul">Multiply (*)</option>
                          <option value="div">Divide (/)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Column 2</label>
                        <select 
                          className="w-full bg-muted border border-transparent text-sm rounded-md p-2 outline-none cursor-pointer"
                          value={step.column2 || ''}
                          onChange={(e) => updateOperation(step.id, { column2: e.target.value })}
                        >
                          <option value="" disabled>Select Col 2</option>
                          {numericalFeatures.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Column Name</label>
                        <input 
                          type="text"
                          placeholder="e.g. Ratio_Feature"
                          className="w-full bg-muted border border-transparent text-sm rounded-md p-2 outline-none focus:border-primary focus:bg-background"
                          value={step.new_column_name || ''}
                          onChange={(e) => updateOperation(step.id, { new_column_name: e.target.value })}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Column</label>
                      <select 
                        className="w-full bg-muted border border-transparent text-sm rounded-md p-2 outline-none cursor-pointer focus:border-primary focus:bg-background transition-colors"
                        value={step.column || ''}
                        onChange={(e) => updateOperation(step.id, { column: e.target.value })}
                      >
                        <option value="" disabled>Select Column</option>
                        {numericalFeatures.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  )}

                  {step.type === "Polynomial" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Degree</label>
                      <input 
                        type="number"
                        min="2" max="5"
                        className="w-full bg-muted border border-transparent text-sm rounded-md p-2 outline-none focus:border-primary focus:bg-background transition-colors"
                        value={step.degree || 2}
                        onChange={(e) => updateOperation(step.id, { degree: parseInt(e.target.value) })}
                      />
                    </div>
                  )}

                  {step.type === "Binning" && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Number of Bins</label>
                        <input 
                          type="number"
                          min="2" max="100"
                          className="w-full bg-muted border border-transparent text-sm rounded-md p-2 outline-none focus:border-primary focus:bg-background"
                          value={step.bins || 3}
                          onChange={(e) => updateOperation(step.id, { bins: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Strategy</label>
                        <select 
                          className="w-full bg-muted border border-transparent text-sm rounded-md p-2 outline-none cursor-pointer"
                          value={step.strategy || 'uniform'}
                          onChange={(e) => updateOperation(step.id, { strategy: e.target.value })}
                        >
                          <option value="uniform">Uniform (Equal Width)</option>
                          <option value="quantile">Quantile (Equal Frequency)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                
                <button 
                  onClick={() => removeOperation(step.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  title="Remove step"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pt-6 mt-4 border-t border-border flex flex-col">
           {error && <p className="text-destructive text-sm mb-3 font-medium bg-destructive/10 p-3 rounded-md border border-destructive/20">{error}</p>}
           {successMsg && <p className="text-emerald-500 text-sm mb-3 font-medium bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20">{successMsg}</p>}
           
           <button 
             onClick={applyPipeline}
             disabled={isLoading || pipeline.length === 0}
             className="w-full py-3 bg-emerald-500 text-white rounded-md text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-emerald-500 flex items-center justify-center"
           >
             {isLoading ? 'Engineering Features...' : <><Play className="w-4 h-4 mr-2"/> Execute Pipeline</>}
           </button>
        </div>
      </div>
    </div>
  );
}
