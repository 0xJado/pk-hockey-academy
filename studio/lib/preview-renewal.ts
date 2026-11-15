type PreviewSource = { postMessage(message: unknown, targetOrigin: string): void };

// Only the actual STRATO iframe may ask its signed-in Studio parent to renew.
export function createPreviewRenewalHandler(options: {
  origin: string;
  frames: () => readonly unknown[];
  createSecret: () => Promise<string>;
  active?: () => boolean;
}) {
  const pending = new Set<unknown>();
  const handled = new Map<string, number>();
  return async (event: {origin: string; source: unknown; data: unknown}) => {
    const data = event.data as Record<string, unknown> | null;
    if (event.origin !== options.origin || !event.source ||
        !options.frames().includes(event.source) || !data ||
        data.type !== 'pk-preview-renew' || typeof data.nonce !== 'string' ||
        !/^[a-f0-9]{64}$/.test(data.nonce) || pending.has(event.source)) return;
    const now = Date.now();
    for (const [nonce, time] of handled) if (now - time > 60000) handled.delete(nonce);
    if (handled.has(data.nonce) || handled.size >= 32) return;
    handled.set(data.nonce, now);
    pending.add(event.source);
    const source = event.source as PreviewSource;
    try {
      const secret = await options.createSecret();
      if (options.active?.() === false || !options.frames().includes(source)) return;
      source.postMessage({type:'pk-preview-renew-result',nonce:data.nonce,secret}, options.origin);
    } catch {
      if (options.active?.() !== false && options.frames().includes(source)) {
        try { source.postMessage({type:'pk-preview-renew-result',nonce:data.nonce,failed:true},options.origin); } catch { /* Frame closed during renewal. */ }
      }
    } finally { pending.delete(source); }
  };
}
