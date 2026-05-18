export interface QuestionItem {
  question: string;
  topic: string | null;
  syndrome: string | null;
}

export interface Reference {
  pageNo: string | null;
  url: string;
  f70: string;
  fileName: string;
}

export interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  references?: Reference[];
  timestamp: Date;
}

export interface ChatResult {
  answer: string;
  references: Reference[];
}
