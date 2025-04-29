export async function emitEvent(
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 10));
  console.log(`[Event Emitted] Type: ${eventType}`, payload);
}
