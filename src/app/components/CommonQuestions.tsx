import { useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import type { QuestionItem } from "../types";

interface CommonQuestionsProps {
  questions: QuestionItem[];
  onSelectQuestion: (question: string) => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

function groupByCategory(items: QuestionItem[]): Record<string, string[]> {
  return items.reduce<Record<string, string[]>>((acc, { question, category }) => {
    (acc[category] ??= []).push(question);
    return acc;
  }, {});
}

export function CommonQuestions({ questions, onSelectQuestion, selectedCategory, onSelectCategory }: CommonQuestionsProps) {
  const grouped = useMemo(() => groupByCategory(questions), [questions]);
  const categories = Object.keys(grouped);

  if (questions.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <p className="text-sm text-gray-600 mb-2">Top Questions by Topic</p>
        <p className="text-sm text-gray-400 italic">No questions available.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        {selectedCategory !== null && (
          <button
            onClick={() => onSelectCategory(null)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Back to topics"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}
        <p className="text-sm text-gray-600">
          {selectedCategory ?? "Top Questions by Topic"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {selectedCategory === null ? (
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-left font-medium"
              >
                {category}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {(grouped[selectedCategory] ?? []).map((question, index) => (
              <button
                key={index}
                onClick={() => onSelectQuestion(question)}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-left"
              >
                {question}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
