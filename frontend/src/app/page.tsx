'use client';
import { UploadDropzone } from "@/components/UploadDropzone";
import { useDatasetStore } from "@/store/useDatasetStore";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { summary } = useDatasetStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const hasDataset = isMounted && !!summary;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pt-4 sm:pt-8 md:pt-10 px-1 sm:px-0">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent pb-2">
          {hasDataset ? "Active Dataset Workspace" : "Welcome to AI Data Copilot"}
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2 sm:mt-4 max-w-2xl mx-auto">
          {hasDataset
            ? "Your dataset is loaded and ready. Explore distributions, run outlier analysis, or engineer features using the navigation menu."
            : "Upload a dataset to begin automated exploratory data analysis, cleaning, and modeling."}
        </p>
      </div>
      
      <UploadDropzone />
    </div>
  );
}
