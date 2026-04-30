import { AlertCircle } from "lucide-react";

export function DisclaimerNotice() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-sm text-amber-800">
          This is an early version of Genetricity, which we are testing and deeply value your feedback in order to improve it. 
          </p>
        </div>
      </div>
    </div>
  );
}