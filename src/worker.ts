import {
  Action,
  AnyAction,
  applyMiddleware,
  compose,
  createStore,
  DeepPartial,
  MiddlewareAPI,
  Reducer,
  StoreCreator,
  StoreEnhancer
} from 'redux'

declare const self: DedicatedWorkerGlobalScope

/**
 * Meta flag for Return Actions.
 */
export const META_FLAG = Symbol('@@redux-worker/returnAction')

/**
 * Checks if the action has a ReturnAction flag.
 */
export const isReturnAction = (action: any): action is Action => META_FLAG in action

/**
 * Mark any Action as a ReturnAction.
 */
export const markReturnAction = (action: AnyAction) =>
  Object.assign({}, action, { [META_FLAG]: true })

/**
 * Return Actions are sent to the client.
 */
export const returnActionCreator = <T extends string>(type: T) => <P, M = undefined>(
  payload: P,
  meta?: M
) =>
  markReturnAction({
    type,
    payload,
    meta
  })

/**
 * The `createWorkerStore` function is identical to the Redux `createStore`
 * functon. Except that is automatically includes the middleware to post
 * ReturnActions to the main thread.
 *
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @template S State object type.
 *
 * @param reducer A function that returns the next state tree, given the
 *   current state tree and the action to handle.
 *
 * @param [preloadedState] The initial state. You may optionally specify it to
 *   hydrate the state from the server in universal apps, or to restore a
 *   previously serialized user session. If you use `combineReducers` to
 *   produce the root reducer function, this must be an object with the same
 *   shape as `combineReducers` keys.
 *
 * @param [enhancer] The store enhancer. You may optionally specify it to
 *   enhance the store with third-party capabilities such as middleware, time
 *   travel, persistence, etc. The only store enhancer that ships with Redux
 *   is `applyMiddleware()`.
 *
 * @returns A Redux store that lets you read the state, dispatch actions and
 *   subscribe to changes.
 */
export const createWorkerStore: StoreCreator = <S, A extends Action, Ext, StateExt>(
  reducer: Reducer<S, A>,
  preloadedStateOrEnhancer?: DeepPartial<S> | StoreEnhancer<Ext, StateExt>,
  enhancer?: StoreEnhancer<Ext, StateExt>
) => {
  // Middleware to handle ReturnActions.
  const returnActionEnhancer = applyMiddleware(
    (_: MiddlewareAPI) => (next: (value: Action) => void) => (action: Action) => {
      if (isReturnAction(action)) {
        self.postMessage(action)
      }
      next(action)
    }
  )
  // Setup Store.
  const store = (() => {
    if (typeof preloadedStateOrEnhancer === 'function') {
      return createStore(
        reducer,
        compose(
          returnActionEnhancer,
          preloadedStateOrEnhancer
        )
      )
    } else if (enhancer !== undefined) {
      return createStore(
        reducer,
        preloadedStateOrEnhancer || {},
        compose(
          returnActionEnhancer,
          enhancer
        )
      )
    } else if (typeof preloadedStateOrEnhancer === 'object') {
      return createStore(reducer, preloadedStateOrEnhancer, returnActionEnhancer)
    } else {
      return createStore(reducer, returnActionEnhancer)
    }
  })()
  // Watch for incomming Actions and dispatch.
  self.onmessage = msg => store.dispatch(msg.data)

  return store
}
