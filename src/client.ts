import { Action, AnyAction, MiddlewareAPI } from 'redux'

export const REDUX_WORKER_ERROR = '@@redux-worker/error-action'
const META_FLAG = Symbol('@@redux-worker/action')

/**
 * Checks if the Action has a Worker Action flag.
 */
export const isWorkerAction = (action: any): action is Action => META_FLAG in action

/**
 * Mark any Action as a WorkerAction.
 */
export const markWorkerAction = (action: AnyAction) =>
  Object.assign({}, action, { [META_FLAG]: true })

/**
 * Worker Actions are sent to the web worker.
 */
export const workerActionCreator = <T extends string>(type: T) => <P, M = undefined>(
  payload: P,
  meta?: M
) =>
  markWorkerAction({
    type,
    payload,
    meta
  })

/**
 * ErrorAction dispatched when Worker emits an error message.
 */
const errorAction = (payload: ErrorEvent) => ({
  type: REDUX_WORKER_ERROR,
  payload
})

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
  let isActive = true

  const reduxWorkerMiddleware = (api: MiddlewareAPI) => (next: (value: Action) => void) => {
    worker.addEventListener('message', evt => api.dispatch(evt.data))
    worker.addEventListener('error', evt => api.dispatch(errorAction(evt)))
    return (action: Action) => {
      if (isActive && (postAll || isWorkerAction(action))) {
        try {
          worker.postMessage(action)
        } catch (err) {
          console.error('Failed to postMessage to ReduxWorker.', err)
        }
      }
      next(action)
    }
  }

  const terminate = () => {
    isActive = false
    worker.terminate()
  }

  return {
    reduxWorkerMiddleware,
    terminate
  }
}
