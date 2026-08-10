import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

// The model used to tag clips and plan edits. Sonnet balances cost and quality;
// bump to "claude-opus-4-7" for harder edit reasoning if needed.
export const EDIT_MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: env.anthropicApiKey });
  }
  return client;
}
