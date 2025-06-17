import { Info } from 'lucide-react';

export function RequiredFieldsInfo() {  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="flex items-center text-xs sm:text-sm text-gray-700 p-2 bg-blue-50 border border-blue-200 rounded-md">
        <Info className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
        <span>Fields highlighted in <span className="text-blue-700 font-medium">blue</span> with an <span className="text-error-500 font-bold">*</span> are required.</span>
      </div>
      <div className="flex items-center text-xs sm:text-sm text-gray-700 p-2 bg-green-50 border border-green-200 rounded-md">
        <Info className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
        <span>Fields highlighted in <span className="text-green-700 font-medium">green</span> marked as <span className="text-green-600">(Optional)</span> can be left blank.</span>
      </div>
    </div>
  );
}
