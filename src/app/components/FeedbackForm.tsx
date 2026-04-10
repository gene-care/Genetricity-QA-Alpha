import { useState } from "react";
import { submitReview } from "../services/api";

interface FeedbackFormProps {
  recordId: string | null;
  onSubmitComplete: () => void;
}

export function FeedbackForm({ recordId, onSubmitComplete }: FeedbackFormProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordId || selectedRating === null) return;

    setIsLoading(true);
    setStatusMessage("");

    try {
      await submitReview(recordId, selectedRating, comment);
      setStatusMessage("✅ Review submitted. Thank you!");
      setSelectedRating(null);
      setComment("");
      onSubmitComplete();
    } catch {
      setStatusMessage("❌ Failed to submit review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-300 p-4">
      <h3 className="mb-4">How helpful was this response?</h3>

      <form onSubmit={handleSubmit}>
        {/* 10-point scale */}
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setSelectedRating(num)}
                disabled={!recordId}
                className={`flex-1 h-10 border border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                  selectedRating === num
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-black"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Not at all likely</span>
            <span>Extremely Likely</span>
          </div>
        </div>

        {/* Comment Box */}
        <div className="mb-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!recordId}
            placeholder={recordId ? "Additional comments..." : "Generate an answer first to leave a review."}
            className="w-full border border-gray-300 p-3 min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>

        {statusMessage && (
          <p className="text-sm mb-3">{statusMessage}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!recordId || selectedRating === null || isLoading}
          className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
