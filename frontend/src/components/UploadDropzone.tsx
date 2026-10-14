'use client';
import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  UploadCloud, 
  AlertCircle, 
  FileSpreadsheet, 
  Database, 
  LogOut, 
  ArrowRight, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { useDatasetStore } from '@/store/useDatasetStore';
import { useRouter } from 'next/navigation';
import { BACKEND_URL, MAX_UPLOAD_MB } from '@/lib/config';

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'done';

export function UploadDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEjecting, setIsEjecting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const { summary, setSummary, reset, setLoading, setError, error } = useDatasetStore();
  const [isWakingServer, setIsWakingServer] = useState(true);

  // Prevent hydration mismatch with Zustand persist localStorage
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ping backend to wake server if deployed on free cold-start tiers
  useEffect(() => {
    let isSubscribed = true;
    const pingServer = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/`);
        if (res.ok && isSubscribed) {
          setIsWakingServer(false);
        } else if (isSubscribed) {
          setTimeout(pingServer, 3000);
        }
      } catch (err) {
        if (isSubscribed) {
          setTimeout(pingServer, 3000);
        }
      }
    };
    pingServer();
    return () => { isSubscribed = false; };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please select a valid CSV file.');
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size allowed is ${MAX_UPLOAD_MB} MB.`);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const processDataset = async () => {
    if (!selectedFile) return;
    
    setError(null);
    setUploadState('uploading');
    setUploadProgress(10);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Use XMLHttpRequest for real upload progress tracking
      const uploadPromise = new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${BACKEND_URL}/upload`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.min(95, Math.round((event.loaded / event.total) * 100));
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error('Invalid response received from server.'));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.detail || 'Failed to upload dataset.'));
            } catch {
              reject(new Error(`Upload failed with server status ${xhr.status}.`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during file upload. Check your backend connection.'));
        xhr.send(formData);
      });

      // Smooth simulated progress increment to ensure visibility
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return prev;
          }
          return prev + 15;
        });
      }, 150);

      const data = await uploadPromise;
      clearInterval(progressTimer);
      
      // Upload finished, transition to analysis phase
      setUploadProgress(100);
      setUploadState('analyzing');
      
      // Brief pause to allow user to see analysis stage before navigating
      await new Promise(r => setTimeout(r, 600));
      
      setSummary(data);
      setUploadState('done');
      router.push('/dataset');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploadState('idle');
    }
  };

  const handleEject = async () => {
    if (!summary?.id) {
      reset();
      return;
    }
    setIsEjecting(true);
    try {
      await fetch(`${BACKEND_URL}/dataset/${summary.id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to eject dataset from backend:', e);
    } finally {
      reset();
      setSelectedFile(null);
      setIsEjecting(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="relative rounded-3xl border border-border/50 bg-card/50 p-12 text-center flex flex-col items-center justify-center min-h-[380px] animate-pulse">
        <div className="h-12 w-12 rounded-full bg-muted mb-4" />
        <div className="h-5 w-48 bg-muted rounded mb-2" />
        <div className="h-4 w-64 bg-muted/70 rounded" />
      </div>
    );
  }

  // 1. Backend Server Wakeup State (Free Cold-start Tier)
  if (isWakingServer) {
    return (
      <div className="relative rounded-3xl border-2 border-border bg-card p-10 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xl">
        <div className="flex flex-col items-center animate-pulse">
          <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-primary animate-bounce" />
          </div>
          <h3 className="text-xl font-semibold text-card-foreground">Waking up the AI Engine...</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Connecting to the AutoML backend. On cloud cold-starts, this may take up to 45 seconds.
          </p>
          <div className="w-64 h-2 bg-secondary rounded-full mt-6 overflow-hidden">
             <div className="h-full bg-primary animate-[pulse_1s_ease-in-out_infinite] w-full rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Uploading... Progress State
  if (uploadState === 'uploading') {
    return (
      <div className="relative rounded-3xl border-2 border-primary/40 bg-card p-10 text-center flex flex-col items-center justify-center min-h-[400px] shadow-2xl">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 animate-pulse">
          <UploadCloud className="h-8 w-8 text-primary animate-bounce" />
        </div>
        
        <h3 className="text-2xl font-bold text-card-foreground">Uploading Dataset...</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Transferring <span className="font-semibold text-foreground">{selectedFile?.name}</span> to the analysis cluster.
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-sm mt-8 space-y-2">
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden p-0.5 border border-border/40">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground px-1 font-mono">
            <span>Uploading...</span>
            <span className="font-semibold text-foreground">{uploadProgress}%</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Analyzing & Crunching Statistics State
  if (uploadState === 'analyzing') {
    return (
      <div className="relative rounded-3xl border-2 border-primary/50 bg-card p-10 text-center flex flex-col items-center justify-center min-h-[400px] shadow-2xl">
        <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-5 animate-pulse shadow-lg shadow-primary/20">
          <Bot className="h-8 w-8 text-primary animate-bounce" />
        </div>
        <h3 className="text-2xl font-bold text-card-foreground">Analyzing Dataset...</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Crunching numbers, profiling datatypes, computing missing ratios, and computing health score.
        </p>
        <div className="w-64 h-2 bg-secondary rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-primary animate-[pulse_1s_ease-in-out_infinite] w-full rounded-full"></div>
        </div>
      </div>
    );
  }

  // 4. Dataset Already Uploaded & Active State
  if (summary) {
    return (
      <div className="relative rounded-3xl border border-border bg-card p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[400px] shadow-2xl">
        {/* Active Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold mb-6 border border-emerald-500/20 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Active Dataset Loaded
        </div>

        <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-sm">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
        </div>

        <h3 className="text-2xl sm:text-3xl font-bold text-card-foreground tracking-tight">
          {summary.filename}
        </h3>

        {/* Quick Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl w-full my-6">
          <div className="bg-background/80 border border-border rounded-xl p-3 text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">Rows</span>
            <span className="text-lg font-bold text-foreground">{summary.rows.toLocaleString()}</span>
          </div>
          <div className="bg-background/80 border border-border rounded-xl p-3 text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">Columns</span>
            <span className="text-lg font-bold text-foreground">{summary.columns.toLocaleString()}</span>
          </div>
          <div className="bg-background/80 border border-border rounded-xl p-3 text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">Missing</span>
            <span className="text-lg font-bold text-foreground">{summary.missing_percentage_total.toFixed(1)}%</span>
          </div>
          <div className="bg-background/80 border border-border rounded-xl p-3 text-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">Target</span>
            <span className="text-lg font-bold text-primary truncate block" title={summary.target_column || "None"}>
              {summary.target_column || "None"}
            </span>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md mt-2">
          <button 
            onClick={() => router.push('/dataset')}
            className="w-full sm:flex-1 py-3 px-5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Database className="w-4 h-4" />
            Explore Dataset
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
          
          <button 
            onClick={handleEject}
            disabled={isEjecting}
            className="w-full sm:w-auto py-3 px-5 bg-destructive/10 text-destructive border border-destructive/20 font-semibold rounded-xl text-sm hover:bg-destructive/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isEjecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Ejecting...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Eject Dataset
              </>
            )}
          </button>
        </div>

        {/* Switch Dataset Option */}
        <button 
          onClick={() => { reset(); setSelectedFile(null); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline mt-6"
        >
          Want to analyze another CSV? Upload a new dataset
        </button>
      </div>
    );
  }

  // 5. Selected File Ready to Upload State
  if (selectedFile) {
    return (
      <div className="relative rounded-3xl border-2 border-border bg-card p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[400px] shadow-2xl">
        <div className="h-16 w-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
          <FileSpreadsheet className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">{selectedFile.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis
        </p>
        
        {error && (
          <div className="mt-4 flex items-center text-destructive text-sm bg-destructive/10 px-4 py-2.5 rounded-lg border border-destructive/20">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            {error}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-8 w-full max-w-xs">
          <button 
            onClick={() => setSelectedFile(null)}
            className="w-full sm:flex-1 py-2.5 px-4 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={processDataset}
            className="w-full sm:flex-1 py-2.5 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <Bot className="w-4 h-4" />
            Upload & Process
          </button>
        </div>
      </div>
    );
  }

  // 6. Default Dropzone State (No Dataset Loaded)
  return (
    <div 
      className={`relative rounded-3xl border-2 transition-all duration-300 p-6 sm:p-10 md:p-16 text-center flex flex-col items-center justify-center min-h-[350px] sm:min-h-[450px] shadow-2xl shadow-black/40
        ${isDragging ? 'border-primary bg-primary/10 scale-[1.02] border-solid' : 'border-border border-dashed bg-card hover:border-primary/50 hover:shadow-primary/5'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
      />
      
      <div 
        className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 cursor-pointer hover:bg-primary/20 transition-all hover:scale-105"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">Upload your CSV</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        Drag and drop your dataset here, or click to browse from your device.
      </p>
      
      {error && (
        <div className="mt-4 flex items-center text-destructive text-sm bg-destructive/10 px-4 py-2.5 rounded-lg border border-destructive/20">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          {error}
        </div>
      )}
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-md flex items-center gap-2"
      >
        <UploadCloud className="w-4 h-4" />
        Select File
      </button>
    </div>
  );
}
