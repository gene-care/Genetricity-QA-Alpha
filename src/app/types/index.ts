export interface QuestionItem {
  question: string;
  category: string;
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

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
}

export interface ChatResult {
  answer: string;
  recordId: string;
  references: Reference[];
}
