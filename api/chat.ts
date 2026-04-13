import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "./_db.js";
import { getOpenAI } from "./_openai.js";
import {
  OPENAI_EMBEDDING_MODEL,
  OPENAI_CHAT_MODEL,
  QUERY_EXPANSION_MODEL,
  RAG_TOP_N,
  RAG_NUM_CANDIDATES,
  RAG_SCORE_THRESHOLD,
  RAG_SEPARATOR_WIDTH,
} from "./_config.js";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReferenceItem {
  pageNo: string | null;
  url: string;
  f70: string;
  fileName: string;
}

// ── Stage 1: Query Expansion ──────────────────────────────────────────────────

async function fetchQueryExpansionPrompt(): Promise<string> {
  const collection = (await getDb("Prompts")).collection("System_Prompts");
  const doc = await collection.findOne({ refID: "alphaTestHFQueryExpansion", version: "1" });
  return (doc?.value as string) ?? "";
}

async function expandQuery(question: string, systemPrompt: string): Promise<string[]> {
  if (!systemPrompt) return [question];

  const response = await getOpenAI().responses.create({
    model: QUERY_EXPANSION_MODEL,
    instructions: systemPrompt,
    input: question,
    text: {
      format: {
        type: "json_schema",
        name: "query_expansion",
        strict: true,
        schema: {
          type: "object",
          properties: {
            expanded_queries: {
              type: "array",
              items: { type: "string" },
              description: "4 alternative reformulations of the original question for semantic search",
            },
          },
          required: ["expanded_queries"],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const parsed = JSON.parse(response.output_text) as { expanded_queries: string[] };
    return parsed.expanded_queries?.length ? parsed.expanded_queries : [question];
  } catch {
    return [question];
  }
}

// ── Stage 2: Vector Search (with deduplication across expanded queries) ───────

async function embed(text: string): Promise<number[]> {
  const res = await getOpenAI().embeddings.create({ input: text, model: OPENAI_EMBEDDING_MODEL });
  return res.data[0].embedding;
}

async function vectorSearch(embedding: number[]) {
  const collection = (await getDb("Grounding_Data")).collection("V1");
  return collection
    .aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: embedding,
          numCandidates: RAG_NUM_CANDIDATES,
          limit: RAG_TOP_N,
        },
      },
      { $project: { _id: 1, data: 1, url: 1, filename: 1, score: { $meta: "vectorSearchScore" } } },
    ])
    .toArray();
}

async function ragSearch(queries: string[]): Promise<{ context: string; references: ReferenceItem[] }> {
  // Run vector search for each expanded query, deduplicating by document _id
  const seenIds = new Set<string>();
  const allResults: Awaited<ReturnType<typeof vectorSearch>> = [];

  for (const query of queries) {
    const embedding = await embed(query);
    const results = await vectorSearch(embedding);

    for (const result of results) {
      const id = result._id.toString();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        allResults.push(result);
      }
    }
  }

  // Build RAG context from deduplicated results above the score threshold
  const separator = "\n" + "-".repeat(RAG_SEPARATOR_WIDTH) + "\n";
  let context = "\n";
  const references: ReferenceItem[] = [];
  let refNum = 1;

  for (const result of allResults) {
    if ((result.score as number) <= RAG_SCORE_THRESHOLD) continue;

    context += `[${refNum}] ${result.data}${separator}`;

    const filename = (result.filename as string) ?? "";
    const parts = filename.split("_");
    const pageNo = parts.length >= 3 ? parts[parts.length - 2] : null;
    const chunkText = (result.data as string).trim();
    const f70 = chunkText.length > 70 ? chunkText.slice(0, 70) : chunkText;

    references.push({ fileName: filename, url: result.url as string, pageNo, f70 });
    refNum++;
  }

  context += "\n\n";
  return { context, references };
}

// ── Stage 3: Answer Generation ────────────────────────────────────────────────

async function fetchSystemPrompt(): Promise<string> {
  const collection = (await getDb("Prompts")).collection("System_Prompts");
  const doc = await collection.findOne({ refID: "alphaTestHF", version: "2" });
  return (doc?.value as string) ?? "";
}

async function generateAnswer(question: string, ragContext: string): Promise<string> {
  const systemPrompt = (await fetchSystemPrompt()).replace("<RAG_Context>", ragContext);
  const response = await getOpenAI().responses.create({
    model: OPENAI_CHAT_MODEL,
    instructions: systemPrompt,
    input: question,
  });
  return response.output_text;
}

// ── Filter citations and renumber to match display order ──────────────────────

function processCitations(
  answer: string,
  references: ReferenceItem[]
): { answer: string; references: ReferenceItem[] } {
  // Collect every cited number, sorted ascending (e.g. [2,3,4,5,6,8,11,13,15])
  const citedNumbers = [
    ...new Set([...answer.matchAll(/\[(\d+)\]/g)].map((m) => parseInt(m[1], 10))),
  ].sort((a, b) => a - b);

  // Keep only the referenced chunks (1-indexed → 0-indexed)
  const citedReferences = references.filter((_, i) => citedNumbers.includes(i + 1));

  // Build old-number → new-sequential-number map
  // e.g. 2→1, 3→2, 4→3, 5→4, 6→5, 8→6, 11→7, 13→8, 15→9
  const oldToNew = new Map<number, number>(
    citedNumbers.map((oldNum, idx) => [oldNum, idx + 1])
  );

  // Single-pass regex replacement — safe because .replace processes left-to-right
  // and the pattern \[\d+\] won't partially match (e.g. [2] ≠ [12])
  const renumberedAnswer = answer.replace(/\[(\d+)\]/g, (match, numStr) => {
    const newNum = oldToNew.get(parseInt(numStr, 10));
    return newNum !== undefined ? `[${newNum}]` : match;
  });

  return { answer: renumberedAnswer, references: citedReferences };
}

// ── Usage Logging ─────────────────────────────────────────────────────────────

async function insertUsageRecord(
  user: string,
  question: string,
  answer: string,
  references: ReferenceItem[]
): Promise<string> {
  const collection = (await getDb("Usage_History")).collection("hf_alpha");
  const result = await collection.insertOne({
    unixTimestamp: String(Math.floor(Date.now() / 1000)),
    user,
    question,
    generatedAnswer: answer,
    refs: references,
  });
  return result.insertedId.toString();
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question, user_id } = req.body as { question: string; user_id: string };
  if (!question?.trim()) return res.status(400).json({ error: "Question cannot be empty" });

  // Stage 1 — expand the question into multiple semantic reformulations
  const expansionPrompt = await fetchQueryExpansionPrompt();
  const expandedQueries = await expandQuery(question, expansionPrompt);

  // Stage 2 — vector search across all expanded queries, deduplicated
  const { context, references } = await ragSearch(expandedQueries);

  // Stage 3 — generate answer using RAG context
  const rawAnswer = await generateAnswer(question, context);

  // Filter to cited references only and renumber [N] in the answer to match display order
  const { answer, references: citedReferences } = processCitations(rawAnswer, references);

  const record_id = await insertUsageRecord(user_id, question, answer, citedReferences);

  return res.json({ answer, record_id, references: citedReferences });
}
