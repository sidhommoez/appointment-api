import { describe, it, expect, vi } from 'vitest';
import { emitEvent } from './emit-event';

describe('emitEvent', () => {
  it('should log the event type and payload', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const eventType = 'TEST_EVENT';
    const payload = { key: 'value' };

    await emitEvent(eventType, payload);

    expect(consoleSpy).toHaveBeenCalledWith(
      `[Event Emitted] Type: ${eventType}`,
      payload,
    );

    consoleSpy.mockRestore();
  });

  it('should simulate an asynchronous operation', async () => {
    const start = Date.now();
    await emitEvent('ASYNC_TEST', {});
    const end = Date.now();

    expect(end - start).toBeGreaterThanOrEqual(10); // Ensure at least 10ms delay
  });
});
