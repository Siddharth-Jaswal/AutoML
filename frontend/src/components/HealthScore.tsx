export function HealthScore({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = "text-green-500";
  if (score < 60) colorClass = "text-destructive";
  else if (score < 80) colorClass = "text-yellow-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="h-24 w-24 transform -rotate-90">
        <circle
          className="text-muted"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="48"
          cy="48"
        />
        <circle
          className={colorClass}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="48"
          cy="48"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{Math.round(score)}</span>
        <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Health</span>
      </div>
    </div>
  );
}
