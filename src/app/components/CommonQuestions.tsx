import { useState, useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import type { QuestionItem } from "../types";

interface CommonQuestionsProps {
  questions: QuestionItem[];
  onSelectQuestion: (question: string) => void;
  selectedQuestion?: string;
}

function groupByField(
  items: QuestionItem[],
  field: "topic" | "syndrome"
): Record<string, string[]> {
  return items.reduce<Record<string, string[]>>((acc, item) => {
    const key = item[field];
    if (!key) return acc;
    (acc[key] ??= []).push(item.question);
    return acc;
  }, {});
}

export function CommonQuestions({ questions, onSelectQuestion, selectedQuestion }: CommonQuestionsProps) {
  const [viewMode, setViewMode] = useState<"topic" | "syndrome">("topic");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const grouped = useMemo(() => groupByField(questions, viewMode), [questions, viewMode]);
  const categories = Object.keys(grouped).sort();

  const handleBackToList = () => setSelectedCategory(null);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-3 flex-shrink-0">
        <div className="flex items-center gap-1 mb-1">
          {selectedCategory !== null && (
            <button
              onClick={handleBackToList}
              className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer flex-shrink-0"
              aria-label="Back to list"
            >
              <ChevronLeft className="w-4 h-4 text-blue-600" strokeWidth={3} />
            </button>
          )}
          <p className="text-sm font-semibold text-gray-900 truncate">
            {selectedCategory ?? "Top Questions"}
          </p>
        </div>

        {selectedCategory === null && (
          <div className="flex items-center gap-2 text-xs ml-1">
            <button
              onClick={() => { setViewMode("topic"); setSelectedCategory(null); }}
              className={`cursor-pointer transition-colors ${
                viewMode === "topic"
                  ? "text-gray-900 font-bold"
                  : "text-gray-500 hover:text-gray-800 underline"
              }`}
            >
              by topic
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => { setViewMode("syndrome"); setSelectedCategory(null); }}
              className={`cursor-pointer transition-colors ${
                viewMode === "syndrome"
                  ? "text-gray-900 font-bold"
                  : "text-gray-500 hover:text-gray-800 underline"
              }`}
            >
              by syndrome
            </button>
          </div>
        )}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
        {selectedCategory === null
          ? categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="w-full px-3 py-2 text-sm font-medium text-left bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                {category}
              </button>
            ))
          : (grouped[selectedCategory] ?? []).map((question, index) => (
              <button
                key={index}
                onClick={() => onSelectQuestion(question)}
                className={`w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors ${
                  selectedQuestion === question ? "bg-gray-50" : "bg-white"
                }`}
              >
                {question}
              </button>
            ))}
      </div>
    </div>
  );
}