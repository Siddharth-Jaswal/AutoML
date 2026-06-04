'use client';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false, 
  loading: () => <div className="h-full w-full flex items-center justify-center animate-pulse bg-muted/10 rounded-xl text-muted-foreground text-sm">Loading chart...</div> 
});

export function PlotlyChart({ data, layout, useResizeHandler = true, className }: any) {
  return (
    <div className={`w-full h-full ${className || ''}`}>
      <Plot
        data={data}
        layout={{
          autosize: true,
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { color: '#a1a1aa' }, // zinc-400 to match dark mode
          xaxis: { gridcolor: '#27272a', zerolinecolor: '#3f3f46', ...layout?.xaxis },
          yaxis: { gridcolor: '#27272a', zerolinecolor: '#3f3f46', ...layout?.yaxis },
          ...layout
        }}
        useResizeHandler={useResizeHandler}
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: false, responsive: true }}
      />
    </div>
  );
}
