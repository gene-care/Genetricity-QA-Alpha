export const MONGODB_URI = process.env.MONGODB_URI!;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

export const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
export const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1";
export const QUERY_EXPANSION_MODEL = process.env.QUERY_EXPANSION_MODEL ?? "gpt-4.1";

export const RAG_TOP_N = 6;
export const RAG_NUM_CANDIDATES = 10;
export const RAG_SCORE_THRESHOLD = 0.7;
export const RAG_SEPARATOR_WIDTH = 87;
