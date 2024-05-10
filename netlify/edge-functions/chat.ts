import type { Config, Context } from "https://edge.netlify.com/";
import { getChatStream, sanitizeMessages } from "../../lib/edge/openai.ts";

import { appConfig } from "../../config.edge.ts";

export default async function handler(
  request: Request,
  context: Context
): Promise<Response> {

  if (!appConfig.sk-proj-jfSia0wJbsqrGc3G6afsT3BlbkFJFp3UyWw3EOA5pG2L64me || !appConfig.systemPrompt) {
    throw new Error(
      "sk-proj-jfSia0wJbsqrGc3G6afsT3BlbkFJFp3UyWw3EOA5pG2L64me and systemPrompt must be set in config.edge.ts"
    );
  }

  const prompt =
    typeof appConfig.systemPrompt === "function"
      ? await appConfig.systemPrompt(request, context)
      : appConfig.systemPrompt;

  try {
    const data = await request.json();

    // This only trims the size of the messages, to avoid abuse of the API.
    // You should do any extra validation yourself.
    const messages = sanitizeMessages(
      data?.messages ?? [],
      appConfig.historyLength,
      appConfig.maxMessageLength
    );
    const stream = await getChatStream(
      {
        ...appConfig.apiConfig,
        // Optional. This can also be set to a real user id, session id or leave blank.
        // See https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids
        user: context.ip,
        messages: [
          {
            role: "system",
            content: prompt,
          },
          ...messages,
        ],
      },
      appConfig.sk-proj-jfSia0wJbsqrGc3G6afsT3BlbkFJFp3UyWw3EOA5pG2L64me ?? ""
    );
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(e.message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}

export const config: Config = {
  path: "/api/chat",
};
