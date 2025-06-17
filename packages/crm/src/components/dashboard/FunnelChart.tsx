import { cva } from 'class-variance-authority';

interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  height?: number;
}

const stageClasses = cva('w-full mb-1 flex items-center justify-center rounded-md transition-all', {
  variants: {
    position: {
      first: 'rounded-t-lg',
      middle: '',
      last: 'rounded-b-lg'
    }
  },
  defaultVariants: {
    position: 'middle'
  }
});

export function FunnelChart({ stages, height = 250 }: FunnelChartProps) {
  // Find max value to normalize widths
  const maxValue = Math.max(...stages.map(stage => stage.value));
  
  // Total value for percentage calculation
  const totalValue = stages.reduce((acc, stage) => acc + stage.value, 0);
  
  return (
    <div className="w-full flex flex-col items-center" style={{ height: `${height}px` }}>
      {stages.map((stage, index) => {
        // Normalize width (min 40%, max 100%)
        const widthPercentage = maxValue === 0 
          ? 40 
          : Math.max(40, Math.min(100, (stage.value / maxValue) * 100));
        
        // Calculate percentage of total
        const percentage = totalValue === 0 
          ? 0 
          : Math.round((stage.value / totalValue) * 100);

        // Determine position for styling
        const position = index === 0 
          ? 'first' 
          : index === stages.length - 1 
            ? 'last' 
            : 'middle';

        return (
          <div 
            key={stage.label}
            className="w-full flex flex-col items-center"
            style={{ width: `${widthPercentage}%` }}
          >
            <div
              className={stageClasses({ position })}
              style={{ 
                backgroundColor: stage.color || '#6366F1',
                height: `${Math.max(25, 60 / stages.length)}px`,
              }}
            >
              <span className="text-white text-xs font-medium">{stage.value}</span>
            </div>
            <div className="mt-1 mb-3 text-xs text-gray-600 text-center flex flex-col items-center">
              <span className="font-medium text-gray-800">{stage.label}</span>
              <span>{percentage}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
