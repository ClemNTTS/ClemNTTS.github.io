import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Handler } from "@netlify/functions";

type PortfolioProject = {
  name?: string;
  description?: string;
  language?: string | null;
  kind?: string;
  url?: string;
  homepage?: string | null;
  tags?: string[];
};

type ChatRequest = {
  question?: string;
  projects?: PortfolioProject[];
};

const MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions";
const defaultModel = "mistral-small-2603";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
    body: JSON.stringify(body),
  };
}

function normalizeContent(content: unknown) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part) {
        return String((part as { text?: unknown }).text ?? "");
      }
      return "";
    })
    .join("")
    .trim();
}

function formatProjects(projects: PortfolioProject[] = []) {
  if (!projects.length) return "Aucun projet dynamique fourni par le frontend.";

  return projects
    .slice(0, 10)
    .map((project) => {
      const tags = project.tags?.length ? ` tags: ${project.tags.join(", ")}` : "";
      const demo = project.homepage ? ` demo: ${project.homepage}` : "";
      return `- ${project.name ?? "Projet"} (${project.language ?? project.kind ?? "stack inconnue"}): ${
        project.description ?? "Pas de description."
      }${tags}${demo} repo: ${project.url ?? "non fourni"}`;
    })
    .join("\n");
}

async function loadKnowledge() {
  const knowledgePath = path.join(process.cwd(), "src", "data", "about-me.md");
  return readFile(knowledgePath, "utf8");
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Methode non supportee." });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return json(503, {
      error: "MISTRAL_API_KEY manque dans les variables d'environnement Netlify.",
    });
  }

  let payload: ChatRequest;
  try {
    payload = JSON.parse(event.body || "{}") as ChatRequest;
  } catch {
    return json(400, { error: "JSON invalide." });
  }

  const question = payload.question?.trim();
  if (!question) {
    return json(400, { error: "Question manquante." });
  }

  if (question.length > 500) {
    return json(400, { error: "Question trop longue." });
  }

  const knowledge = await loadKnowledge();
  const projectContext = formatProjects(payload.projects);

  const systemPrompt = `Tu es l'assistant de portfolio de Clement Nuttens.
Tu reponds en francais, avec un ton clair, utile, legerement decale mais professionnel.
Tu n'es pas Clement: tu parles de lui a la troisieme personne.
Tu utilises uniquement le contexte fourni. Si l'information manque, dis-le franchement.
Reponses courtes: 3 a 7 phrases maximum.

CONTEXTE PERSONNEL:
${knowledge}

PROJETS PUBLICS DETECTES:
${projectContext}`;

  const mistralResponse = await fetch(MISTRAL_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.MISTRAL_MODEL || defaultModel,
      temperature: 0.45,
      max_tokens: 420,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    }),
  });

  const mistralPayload = (await mistralResponse.json().catch(() => null)) as
    | {
        choices?: Array<{
          message?: {
            content?: unknown;
          };
        }>;
        message?: string;
      }
    | null;

  if (!mistralResponse.ok) {
    return json(502, {
      error: mistralPayload?.message || "Mistral n'a pas accepte la requete.",
    });
  }

  const answer = normalizeContent(mistralPayload?.choices?.[0]?.message?.content);
  if (!answer) {
    return json(502, { error: "Reponse Mistral vide." });
  }

  return json(200, { answer });
};
