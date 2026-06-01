/** AbortSignal.timeout is missing on some mobile Safari versions. */
export function createTimeoutSignal(ms: number): {
  signal: AbortSignal;
  clear: () => void;
} {
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    return { signal: AbortSignal.timeout(ms), clear: () => {} };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new DOMException('The operation timed out.', 'TimeoutError'));
  }, ms);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}
