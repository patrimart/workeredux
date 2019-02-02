import { Action, MiddlewareAPI } from 'redux';
import { errorAction, isWorkerAction } from './actions';
import { TRANSFERABLE_FLAG, hasTransferables } from '../transferables';

/**
 * Function to create Redux Worker middleware.
 *
 * @param worker - the Worker instance.
 *
 * @param [postAll] - set to `true` to post all Actions to the Worker.
 *
 * @returns The `reduxWorkerMiddlewate` and a `terminate` function.
 */
export function createReduxWorkerMiddleware(worker: Worker, postAll = false) {
  let isActive = true;

  const reduxWorkerMiddleware = (api: MiddlewareAPI) => (next: (value: Action) => void) => {
    worker.addEventListener('message', evt => api.dispatch(evt.data));
    worker.addEventListener('error', evt => api.dispatch(errorAction(evt)));
    return (action: Action) => {
      if (isActive && (postAll || isWorkerAction(action))) {
        try {
          if (hasTransferables(action)) {
            worker.postMessage(action, action[TRANSFERABLE_FLAG]);
          } else {
            worker.postMessage(action);
          }
        } catch (err) {
          console.error('Failed to postMessage to ReduxWorker.', err);
        }
      }
      next(action);
    };
  };

  const terminate = () => {
    isActive = false;
    worker.terminate();
  };

  return {
    reduxWorkerMiddleware,
    terminate,
  };
}
