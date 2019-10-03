import { Action, AnyAction } from 'redux';

/**
 * Hidden flag for Return Actions.
 */
export const META_FLAG = Symbol('@@workeredux/returnAction');

/**
 * Type guard checks if the action has a ReturnAction flag.
 */
export const isReturnAction = <T extends string, A extends AnyAction & Action<T>>(
  action: A,
): action is A => META_FLAG in action;

/**
 * Mark any Action as a ReturnAction, returning a new Action.
 */
export const markReturnAction = <T extends string, A extends AnyAction & Action<T>>(action: A): A =>
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
