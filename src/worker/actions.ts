import { Action, AnyAction } from 'redux';

/**
 * Meta flag for Return Actions.
 */
export const META_FLAG = Symbol('@@redux-worker/returnAction');

/**
 * Type guard checks if the action has a ReturnAction flag.
 */
export const isReturnAction = <T extends string>(action: any): action is AnyAction & Action<T> =>
  META_FLAG in action;

/**
 * Mark any Action as a ReturnAction.
 */
export const markReturnAction = <T extends string>(action: AnyAction & Action<T>) =>
  Object.assign({}, action, { [META_FLAG]: true });

/**
 * Return Actions are sent to the client.
 */
export const returnActionCreator = <P, T extends string = string, M = undefined>(type: T) => (
  payload: P,
  meta?: M,
) =>
  markReturnAction({
    type,
    payload,
    meta,
  });
