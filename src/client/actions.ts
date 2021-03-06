import { Action, AnyAction } from 'redux';

/**
 * Error Action type.
 */
export const REDUX_WORKER_ERROR = '@@redux-worker/error-action';

const META_FLAG = Symbol('@@workeredux/workerAction');

/**
 * Type guard checks if the Action has a Worker Action flag.
 */
export const isWorkerAction = <T extends string, A extends AnyAction & Action<T>>(
  action: A,
): action is A => META_FLAG in action;

/**
 * Type guard checks for Worker Error Action.
 */
export const isErrorAction = (action: AnyAction): action is Action<typeof REDUX_WORKER_ERROR> =>
  action.type === REDUX_WORKER_ERROR;

/**
 * Mark any Action as a WorkerAction.
 */
export const markWorkerAction = <T extends string, A extends AnyAction & Action<T>>(action: A): A =>
  Object.assign({}, action, { [META_FLAG]: true });

/**
 * Worker Actions are sent to the web worker.
 */
export const workerActionCreator = <P, T extends string = string, M = undefined>(type: T) => (
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
