// Single place that reads secrets from the environment (.env.local).
// Keep all key access here so nothing else touches process.env directly.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local (see .env.example).`,
    );
  }
  return value;
}

export const env = {
  // Set ANTHROPIC_API_KEY in .env.local to enable the Phase 2 AI editing.
  get anthropicApiKey() {
    return required("ANTHROPIC_API_KEY");
  },
  get hasAnthropicKey() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },
};
