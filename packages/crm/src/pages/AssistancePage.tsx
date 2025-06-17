import { AIAssistance } from '../components/assistance/AIAssistance';

export function AssistancePage() {
  return (
    <div className="h-full">
      <div className="max-w-4xl mx-auto h-full">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-semibold text-gray-900">AI Assistance</h1>
            <p className="mt-1 text-sm text-gray-500">
              Get help with your tasks using our AI assistant
            </p>
          </div>
          <div className="flex-1">
            <AIAssistance />
          </div>
        </div>
      </div>
    </div>
  );
} 