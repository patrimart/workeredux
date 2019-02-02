import { Action, AnyAction } from 'redux';

/**
 * Hidden flag for Actions with transferables.
 */
export const TRANSFERABLE_FLAG = Symbol('@@workeredux/transferable');

export type ActionWithTransferable<T extends string> = AnyAction &
  Action<T> & {
    readonly [TRANSFERABLE_FLAG]: Transferable[];
  };

/**
 * Checks if the Action has any Transferable object(s).
 */
export const hasTransferables = <T extends string>(
  action: AnyAction & Action<T>,
): action is ActionWithTransferable<T> => TRANSFERABLE_FLAG in action;

/**
 * Sets the Treansferable object(s) and returns a new Action.
 */
export const setTransferables = <T extends string>(
  action: AnyAction & Action<T>,
  transfer: ReadonlyArray<Transferable>,
) => Object.assign({}, action, { [TRANSFERABLE_FLAG]: transfer });

/**
 * Gets the Transferable object(s) from the Action.
 */
export const getTransferables = <T extends string>(
  action: AnyAction & Action<T>,
): ReadonlyArray<Transferable> | undefined => action.TRANSFERABLE_FLAG;
