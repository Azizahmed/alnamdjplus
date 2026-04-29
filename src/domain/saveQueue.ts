export interface TimerAdapter {
  set: (callback: () => void, delayMs: number) => unknown;
  clear: (timerId: unknown) => void;
}

export interface DebouncedSaveQueueOptions {
  delayMs: number;
  timer?: TimerAdapter;
}

const defaultTimer: TimerAdapter = {
  set: (callback, delayMs) => window.setTimeout(callback, delayMs),
  clear: (timerId) => window.clearTimeout(timerId as number),
};

export const createDebouncedSaveQueue = ({
  delayMs,
  timer = defaultTimer,
}: DebouncedSaveQueueOptions) => {
  const pending = new Map<string, unknown>();

  const cancel = (key: string) => {
    const existingTimer = pending.get(key);
    if (existingTimer !== undefined) {
      timer.clear(existingTimer);
      pending.delete(key);
    }
  };

  return {
    schedule: (key: string, task: () => void) => {
      cancel(key);
      const timerId = timer.set(() => {
        pending.delete(key);
        task();
      }, delayMs);
      pending.set(key, timerId);
    },

    cancel,

    cancelAll: () => {
      pending.forEach((timerId) => timer.clear(timerId));
      pending.clear();
    },
  };
};
