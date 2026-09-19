const timers = new Set<number>();

/** Copy text and wipe clipboard after `clearMs` (default 30s). */
export async function copyWithAutoClear(text: string, clearMs = 30_000): Promise<void> {
  if (!text) {
    return;
  }
  await navigator.clipboard.writeText(text);
  const timer = window.setTimeout(() => {
    void navigator.clipboard.writeText("").catch(() => undefined);
    timers.delete(timer);
  }, clearMs);
  timers.add(timer);
}

export function cancelClipboardClearTimers(): void {
  for (const timer of timers) {
    window.clearTimeout(timer);
  }
  timers.clear();
}
