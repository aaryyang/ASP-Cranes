import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

export interface CollapsibleCardProps {
  children: ReactNode;
  title: string | ReactNode;
  defaultExpanded?: boolean;
  icon?: ReactNode;
  className?: string;
  onToggle?: (isExpanded: boolean) => void;
}

export function CollapsibleCard({ 
  children, 
  title, 
  defaultExpanded = false,
  icon,
  className = '',
  onToggle
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  return (
    <Card className={`shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors duration-200 p-3 sm:p-4 md:p-5" 
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon && <div className="text-gray-500 flex-shrink-0">{icon}</div>}
            <CardTitle className="text-base sm:text-lg font-medium">
              {title}
            </CardTitle>
          </div>
          <div className={`transform transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
        </div>
      </CardHeader>
      <div 
        className={`transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{
          // Add hardware acceleration for smoother animations
          transform: 'translateZ(0)',
        }}
      >
        <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
          {children}
        </CardContent>
      </div>
    </Card>
  );
}