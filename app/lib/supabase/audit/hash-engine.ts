import crypto from "crypto";

export function createEventHash(
  event: any,
  previousHash: string | null
) {
  const data = {
    type: event.type,
    table: event.table,
    operation: event.operation,
    payload: event.payload,
    previousHash,
    timestamp: Date.now(),
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
}