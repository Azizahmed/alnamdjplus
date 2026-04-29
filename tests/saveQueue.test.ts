import { createDebouncedSaveQueue } from '../src/domain/saveQueue.ts';

const scheduled: { id: number; callback: () => void; delay: number }[] = [];
const cleared: unknown[] = [];

const queue = createDebouncedSaveQueue({
  delayMs: 500,
  timer: {
    set: (callback, delay) => {
      const id = scheduled.length + 1;
      scheduled.push({ id, callback, delay });
      return id;
    },
    clear: (timerId) => {
      cleared.push(timerId);
    },
  },
});

const calls: string[] = [];
queue.schedule('question-1', () => calls.push('first'));
queue.schedule('question-1', () => calls.push('second'));

if (scheduled[0].delay !== 500 || scheduled[1].delay !== 500) {
  throw new Error('scheduled saves should use the configured delay');
}

if (cleared[0] !== 1) {
  throw new Error('scheduling the same key should cancel the previous pending save');
}

scheduled[1].callback();
if (calls.join(',') !== 'second') {
  throw new Error(`only the latest scheduled task should run, got ${calls.join(',')}`);
}

queue.schedule('question-2', () => calls.push('third'));
queue.cancelAll();
if (!cleared.includes(3)) {
  throw new Error('cancelAll should clear pending saves');
}
