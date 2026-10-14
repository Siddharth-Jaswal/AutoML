import { UploadDropzone } from "@/components/UploadDropzone";

export default function Dashboard() {
  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pt-4 sm:pt-8 md:pt-10 px-1 sm:px-0">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent pb-2">
          Welcome to AI Data Copilot
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2 sm:mt-4 max-w-2xl mx-auto">
          Upload a dataset to begin automated exploratory data analysis, cleaning, and modeling.
        </p>
      </div>
      
      <UploadDropzone />
    </div>
  );
}
