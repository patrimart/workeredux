import { Action } from 'redux';
import { TRANSFERABLE_FLAG, hasTransferables, ActionWithTransferable } from './transferables';

const INTERVAL_MS = 33;

export const actionBuffer = (
  worker: Worker | DedicatedWorkerGlobalScope,
): [(a: Action) => void, () => void] => {
  const buffer: (Action | ActionWithTransferable<any>)[] = [];

  const ref = setInterval(() => {
    if (buffer.length === 0) {
      return;
    }
    try {
      if (hasTransferables(buffer[0])) {
        const action = buffer.pop();
        if (action && hasTransferables(action)) {
          worker.postMessage(action, action[TRANSFERABLE_FLAG]);
        }
        return;
      }
      const actions: Action[] = [];
      while (buffer.length > 0 && !hasTransferables(buffer[0])) {
        const action = buffer.pop();
        if (action) {
          actions.push(action);
        }
      }
      if (actions.length > 0) {
        worker.postMessage(actions.length > 1 ? actions : actions[0]);
      }
    } catch (err) {
      console.error('Failed to postMessage.', err);
    }
  }, INTERVAL_MS);

  return [
    (action: Action) => {
      buffer.push(action);
    },
    () => clearInterval(ref),
  ];
};
