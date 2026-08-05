import { semanticSearch } from "./searchService.js";
import { isVectorSearchEnabled, vectorSearch } from "./vectorService.js";

/**
 * Retrieval-augmented answer generation.
 *
 * If GROQ_API_KEY is set, we call Groq's Llama 3.3 with the retrieved
 * context (real RAG). If not, we fall back to a deterministic templated
 * answer built directly from the retrieved documents, so the Q&A feature
 * works immediately with zero API keys.
 */

async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are BrainHub AI, an organizational memory assistant. Answer only from the provided context. Cite decision titles and dates when relevant. If the context doesn't contain the answer, say so plainly.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("Groq call failed, falling back to template answer:", err.message);
    return null;
  }
}

function buildFallbackAnswer(question, contextDocs) {
  if (contextDocs.length === 0) {
    return "I couldn't find any decisions, meetings, or commits related to that in the organizational memory yet.";
  }

  const lines = contextDocs.slice(0, 3).map((d) => {
    const author = d.author ? ` — decided/owned by ${d.author}` : "";
    return `**${d.title}** (${d.date}, ${d.type})${author}. ${d.text}`;
  });

  return [
    `Based on what's recorded in the organizational memory:`,
    ...lines,
  ].join("\n\n");
}

export async function answerQuestion(question) {
  let contextDocs;
  try {
    contextDocs = isVectorSearchEnabled()
      ? await vectorSearch(question, { limit: 5 })
      : semanticSearch(question, { limit: 5 });
  } catch (err) {
    console.error("Vector search failed, falling back to keyword search:", err.message);
    contextDocs = semanticSearch(question, { limit: 5 });
  }

  const contextText = contextDocs
    .map((d) => `[${d.type.toUpperCase()}] ${d.title} (${d.date}): ${d.text}`)
    .join("\n");

  const prompt = `Context from organizational memory:\n${contextText}\n\nQuestion: ${question}`;

  const groqAnswer = await callGroq(prompt);
  const answer = groqAnswer || buildFallbackAnswer(question, contextDocs);

  return {
    answer,
    sources: contextDocs.map((d) => ({ id: d.id, title: d.title, type: d.type, date: d.date })),
    usedLLM: Boolean(groqAnswer),
  };
}
