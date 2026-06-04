'use client';
import { useDatasetStore } from "@/store/useDatasetStore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Wrench, Plus, X, ArrowRight, Play, CheckCircle } from "lucide-react";

interface Operation {
  type: string;
  columns: string[];
}

export default function Preprocessing() {
  const { summary, setSummary } = useDatasetStore();
  const router = useRouter();
  
  const [operations, setOperations] = useState<Operation[]>([]);
  const [selectedOpType, setSelectedOpType] = useState('StandardScaler');
  const [selectedColumn, setSelectedColumn] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!summary) {
      router.push('/');
    }
  }, [summary, router]);



  const addOperation = () => {
    if (!selectedColumn) return;
    setOperations([...operations, { type: selectedOpType, columns: [selectedColumn] }]);
    setSuccess(false);
  };

  const removeOperation = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index));
  };

  const applyPreprocessing = async () => {
    if (operations.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`http://localhost:8000/dataset/${summary.id}/preprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to preprocess');
      }
      
      const newSummary = await res.json();
      setSummary(newSummary);
      setOperations([]);
      setSuccess(true);
      
      // Auto-hide success after 3s
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const numericalOps = ["StandardScaler", "MinMaxScaler", "RobustScaler", "FillMissingMean", "FillMissingMedian", "DropMissingRows", "VarianceThreshold"];
  const categoricalOps = ["LabelEncoder", "OneHotEncoding", "OrdinalEncoder", "FillMissingMode", "DropMissingRows"];
  const allOps = [...new Set([...numericalOps, ...categoricalOps, "DropColumns", "PCA"])].sort();

  if (!summary) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 pb-10 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Wrench className="w-8 h-8 mr-3 text-primary" />
          Preprocessing & Feature Engineering
        </h1>
        <p className="text-muted-foreground mt-2">
          Build a pipeline of scikit-learn transformations to clean and prepare your data for modeling.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold border-b border-border pb-2">Add Operation</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Column</label>
              <select 
                className="w-full bg-background border border-border text-foreground text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none"
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
              >
                <option value="">Select a column...</option>
                {summary.columns_info.map(col => (
                  <option key={col.name} value={col.name}>{col.name} ({col.type})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Transformation</label>
              <select 
                className="w-full bg-background border border-border text-foreground text-sm rounded-md focus:ring-primary focus:border-primary p-2.5 outline-none"
                value={selectedOpType}
                onChange={(e) => setSelectedOpType(e.target.value)}
              >
                {allOps.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={addOperation}
              disabled={!selectedColumn}
              className="w-full px-4 py-2.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Pipeline
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
          <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4">Execution Pipeline</h2>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            {operations.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No operations added yet.
              </div>
            ) : (
              operations.map((op, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/30 border border-border rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-background rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border border-border">{i + 1}</div>
                    <div>
                      <span className="font-semibold text-sm text-foreground block">{op.type}</span>
                      <span className="text-xs text-muted-foreground font-mono">{op.columns.join(', ')}</span>
                    </div>
                  </div>
                  <button onClick={() => removeOperation(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-border mt-4">
            {error && <div className="text-destructive text-sm mb-3">{error}</div>}
            {success && <div className="text-green-500 text-sm mb-3 flex items-center"><CheckCircle className="w-4 h-4 mr-2"/> Pipeline applied successfully!</div>}
            <button 
              onClick={applyPreprocessing}
              disabled={operations.length === 0 || isProcessing}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Apply Preprocessing to Dataset
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
