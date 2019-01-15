import { Action, AnyAction } from 'redux';

/**
 * Error Action type.
 */
export const REDUX_WORKER_ERROR = '@@redux-worker/error-action';

const META_FLAG = Symbol('@@redux-worker/action');

/**
 * Type guard checks if the Action has a Worker Action flag.
 */
export const isWorkerAction = <T extends string>(
  action: AnyAction,
): action is AnyAction & Action<T> => META_FLAG in action;

/**
 * Type guard checks for Worker Error Action.
 */
export const isErrorAction = (action: AnyAction): action is Action<typeof REDUX_WORKER_ERROR> =>
  action.type === REDUX_WORKER_ERROR;

/**
 * Mark any Action as a WorkerAction.
 */
export const markWorkerAction = <T extends string>(action: AnyAction & Action<T>) =>
  Object.assign({}, action, { [META_FLAG]: true });

/**
 * Worker Actions are sent to the web worker.
 */
export const workerActionCreator = <T extends string>(type: T) => <P, M = undefined>(
  payload: P,
  meta?: M,
) =>
  markWorkerAction({
    type,
    payload,
    meta,
  });

/**
 * ErrorAction dispatched when Worker emits an error message.
 */
export const errorAction = (payload: ErrorEvent) => ({
  type: REDUX_WORKER_ERROR,
  payload,
});
