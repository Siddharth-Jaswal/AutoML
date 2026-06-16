'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, UploadCloud, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useDatasetStore } from '@/store/useDatasetStore';
import { useRouter } from 'next/navigation';
import { BACKEND_URL, MAX_UPLOAD_MB } from '@/lib/config';

export function UploadDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const { setLoading, setSummary, setError, isLoading, error } = useDatasetStore();
  const [isWakingServer, setIsWakingServer] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const pingServer = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/`);
        if (res.ok && isMounted) {
          setIsWakingServer(false);
        } else if (isMounted) {
          setTimeout(pingServer, 3000);
        }
      } catch (err) {
        if (isMounted) {
          setTimeout(pingServer, 3000);
        }
      }
    };
    pingServer();
    return () => { isMounted = false; };
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
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to upload file');
      }
      
      const data = await response.json();
      setSummary(data);
      router.push('/dataset');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isWakingServer) {
    return (
      <div className="relative rounded-xl border-2 border-border bg-card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center animate-pulse">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-primary animate-bounce" />
          </div>
          <h3 className="text-xl font-semibold text-card-foreground">Waking up the AI Server...</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Connecting to the backend cluster. On free hosting tiers, this might take up to 50 seconds to spin up from sleep. Please wait!
          </p>
          <div className="w-64 h-2 bg-secondary rounded-full mt-8 overflow-hidden">
             <div className="h-full bg-primary animate-[pulse_1s_ease-in-out_infinite] w-full rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative rounded-xl border-2 border-border bg-card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center animate-pulse">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-primary animate-bounce" />
          </div>
          <h3 className="text-xl font-semibold text-card-foreground">Analyzing Dataset...</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            The AI is crunching the numbers. For large datasets, this might take a few moments.
          </p>
          <div className="w-64 h-2 bg-secondary rounded-full mt-8 overflow-hidden">
             <div className="h-full bg-primary animate-[pulse_1s_ease-in-out_infinite] w-full rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedFile) {
    return (
      <div className="relative rounded-xl border-2 border-border bg-card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <FileSpreadsheet className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-card-foreground">{selectedFile.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
        </p>
        
        {error && (
          <div className="mt-4 flex items-center text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}
        
        <div className="flex items-center space-x-4 mt-8">
          <button 
            onClick={() => setSelectedFile(null)}
            className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={processDataset}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center"
          >
            <Bot className="w-4 h-4 mr-2" />
            Process Dataset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative rounded-3xl border-2 transition-all duration-300 p-16 text-center flex flex-col items-center justify-center min-h-[450px] shadow-2xl shadow-black/40
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
      
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 cursor-pointer hover:bg-primary/20 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-card-foreground">Upload your CSV</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        Drag and drop your dataset here, or click to browse.
      </p>
      
      {error && (
        <div className="mt-4 flex items-center text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
      >
        Select File
      </button>
    </div>
  );
}
