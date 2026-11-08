// Stub for @/lib/ai/anthropic-client, used ONLY by scripts/verify-no-grade-task.mts (RR-399 A2). The proof never reaches the
// model ($0): if a request ever got this far, this stub fails loudly instead of calling anyone.
export function getAnthropicClient(): never {
  throw new Error("RR-399 proof: an AI call was attempted");
}
export async function recordCost(): Promise<void> {}
