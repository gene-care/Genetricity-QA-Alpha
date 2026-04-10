import { AlertCircle } from "lucide-react";

export function DisclaimerNotice() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-1">Notice</h3>
          <p className="text-sm text-amber-800">
            Do not include PII or personal data in your prompts. By using this tool, you agree to your prompts being used for research purposes and to help improve this tool.
          </p>
        </div>
      </div>
    </div>
  );
}