import type { AuditLog } from "@/lib/types";

// Recomputes each log's hash from its eventData + previousHash and
// checks it against the stored currentHash. This is genuinely useful,
// not decorative — if you ever let an admin "edit" a mock log in a
// demo to simulate tampering, this function will correctly flag it.
//
// Uses the Web Crypto API (available in browsers and edge runtimes)
// rather than Node's crypto module, so this works client-side too.
export async function verifyHashChain(
  logs: AuditLog[]
): Promise<{ valid: boolean; brokenAtIndex: number | null }> {
  let expectedPreviousHash = "0000000000000000";

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    if (log.previousHash !== expectedPreviousHash) {
      return { valid: false, brokenAtIndex: i };
    }

    const computedHash = await sha256Truncated(JSON.stringify(log.eventData) + log.previousHash);

    if (computedHash !== log.currentHash) {
      return { valid: false, brokenAtIndex: i };
    }

    expectedPreviousHash = log.currentHash;
  }

  return { valid: true, brokenAtIndex: null };
}

async function sha256Truncated(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 16);
}