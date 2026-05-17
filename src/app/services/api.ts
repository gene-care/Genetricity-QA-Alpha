import type { ChatResult, QuestionItem, Reference } from "../types";

/** Stored on usage records when there is no logged-in user. */
const ANONYMOUS_USER_ID = "anonymous";

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

export async function fetchQuestions(): Promise<QuestionItem[]> {
  return get<QuestionItem[]>("/api/questions");
}

export async function sendChat(question: string): Promise<ChatResult> {
  const data = await post<{ answer: string; references: Reference[] }>("/api/chat", {
    question,
    user_id: ANONYMOUS_USER_ID,
  });
  return { answer: data.answer, references: data.references };
}

export async function fetchPresetAnswer(question: string): Promise<ChatResult> {
  const data = await post<{ answer: string; references: Reference[] }>("/api/prefetch", {
    question,
    user_id: ANONYMOUS_USER_ID,
  });
  return { answer: data.answer, references: data.references };
}
