import { Action, MiddlewareAPI } from 'redux';
import { errorAction, isWorkerAction } from './actions';
import { actionBuffer } from '../actionBuffer';

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
  const [dispatch, closeArrayBuffer] = actionBuffer(worker);

  const reduxWorkerMiddleware = (api: MiddlewareAPI) => (next: (value: Action) => void) => {
    worker.addEventListener('message', evt =>
      Array.isArray(evt.data) ? evt.data.map(d => api.dispatch(d)) : api.dispatch(evt.data),
    );
    worker.addEventListener('error', evt => api.dispatch(errorAction(evt)));
    return (action: Action) => {
      if (isActive && (postAll || isWorkerAction(action))) {
        dispatch(action);
      }
      next(action);
    };
  };

  const terminate = () => {
    isActive = false;
    closeArrayBuffer();
    worker.terminate();
  };

  return {
    reduxWorkerMiddleware,
    terminate,
  };
}
