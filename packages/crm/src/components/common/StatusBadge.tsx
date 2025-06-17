import { cn } from '../../utils/cn';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost' | 'converted';
export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

type StatusBadgeProps = {
  status: LeadStatus | JobStatus | QuotationStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (status: LeadStatus | JobStatus | QuotationStatus) => {
    switch (status) {
      // Lead statuses
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-purple-100 text-purple-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'converted':
        return 'bg-green-100 text-green-800';
      
      // Job statuses
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      
      // Quotation statuses
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap',
        getStatusColor(status),
        className
      )}
    >
      {(status || '').replace('_', ' ')}
    </span>
  );
}