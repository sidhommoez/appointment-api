export async function emitEvent(
    eventType: string,
    payload: Record<string, unknown>
): Promise<void> {
    console.log(`[Event Emitted] Type: ${eventType}`, payload);
}
