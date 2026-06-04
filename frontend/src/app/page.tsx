import { UploadDropzone } from "@/components/UploadDropzone";

export default function Dashboard() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pt-10">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent pb-2">
          Welcome to AI Data Copilot
        </h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
          Upload a dataset to begin automated exploratory data analysis, cleaning, and modeling.
        </p>
      </div>
      
      <UploadDropzone />
    </div>
  );
}
