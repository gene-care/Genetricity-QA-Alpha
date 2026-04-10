import type { AuthState, ChatResult, QuestionItem, Reference } from "../types";

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export async function login(userid: string, password: string): Promise<AuthState & { message: string }> {
  const data = await post<{ success: boolean; message: string }>("/api/login", { userid, password });
  return {
    isAuthenticated: data.success,
    userId: data.success ? userid : null,
    message: data.message,
  };
}

export async function fetchQuestions(): Promise<QuestionItem[]> {
  return get<QuestionItem[]>("/api/questions");
}

export async function sendChat(question: string, userId: string): Promise<ChatResult> {
  const data = await post<{ answer: string; record_id: string; references: Reference[] }>(
    "/api/chat",
    { question, user_id: userId }
  );
  return { answer: data.answer, recordId: data.record_id, references: data.references };
}

export async function submitReview(recordId: string, rating: number, comment: string): Promise<void> {
  await post("/api/review", { record_id: recordId, rating, comment });
}
