# workeredux

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/workeredux.svg?style=flat)](https://www.npmjs.com/package/workeredux)

## Worker Redux — Run `Redux` reducers and middleware in a Web Worker.

This library makes it trivial to process expensive calculations in a Web Worker
while using the `Redux` pattern you know and love.

If you know `Redux`, you already know how to use `workeredux`.

This library is built with `TypeScript`.

---

## Installation

Using **npm**:

```
$ npm i workeredux
$ npm i -D worker-loader
```

Using **Yarn**:

```
$ yarn add workeredux
$ yarn add -D worker-loader
```

---

## Action Flow via Redux with Web Workers

Actions pass through the Redux reducers and middlewares on the main thread as expected.

The `reduxWorkerMiddleware` will send Actions marked as **WorkerActions** to the Worker.

- Create a **WorkerAction** with `workerActionCreator`.
- Mark an Action as a **WorkerAction** with `markWorkerAction`.

The **WorkerAction** will pass through the Redux reducers and middlewares in the Worker.

If an Effect in the Worker dispatches a **ReturnAction** it will be dispatched to the main thread.

- Create a **ReturnAction** with `returnActionCreator`.
- Mark an Action as a **ReturnAction** with `markReturnAction`.

Here's a fun little chart of the Action path.

```
           +----------+    +----------+    +----------+
ACTION1 -> | Reducers | -> |  Store   | -> | Effects  | -> ACTION2
    ↑      +----------+    +----------+ |  +----------+
    |                                   |  +----------+
    |             ACTION w/ Worker Flag +->|  Worker  | -> ACTION3
    |                                      +----------+ |
    |                                                   |
    +---------------------------------------------------+ ACTION w/ Return Flag
```

> TIP: Take extra care to watch for infinite loops. Especially if
> setting `postAll: true` in `createReduxWorkerMiddleware`.

> TIP: Only run expensive calculations in the Worker. Attempting to run
> everything in the worker will surely lead to madness.

> TIP: Use **ReturnActions** to pass Worker state to the main thread.

---

## Code Examples

### `counter.worker.ts`

Example of code that will run in the Web Worker.

```ts
import { applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import { put, select, takeEvery } from 'redux-saga/effects';
import { createWorkerStore, returnActionCreator } from 'workeredux';

const defaultState = { counter: 0 };

const reducer = (state = defaultState, action: any) => {
  switch (action.type) {
    case 'counter/increment':
      return {
        counter: state.counter + action.payload || 0,
      };
  }
  return state;
};

const counterAction = returnActionCreator('reduxWorker/counter');

function* saga() {
  yield takeEvery('counter/increment', function*() {
    const { counter } = yield select();
    yield put(counterAction(counter));
  });
}

const sagaMiddleware = createSagaMiddleware();

createWorkerStore(
  reducer,
  applyMiddleware(
    createLogger({
      collapsed: false,
    }),
    sagaMiddleware,
  ),
);

sagaMiddleware.run(saga);
```

### `initStore.ts`

Example of Redux store setup.

```ts
import { createReduxWorkerMiddleware } from 'workeredux';

import sagas from './sagas';
import reducers from './reducers';

// Use Webpack's worker-loader to import the Worker.
import ReduxWorker from 'worker-loader!./counter.worker';
// Create the middleware for the Worker.
const { reduxWorkerMiddleware } = createReduxWorkerMiddleware(new ReduxWorker());

const sagaMiddleware = createSagaMiddleware();
const composeMiddlewares = applyMiddleware(
  reduxWorkerMiddleware,
  sagaMiddleware,
  createLogger({
    collapsed: true,
  }),
);

export function initStore() {
  store = createStore(reducers, composeMiddlewares);
  sagaMiddleware.run(sagas);
  return store;
}
```

## Library Interface

### Client

```ts
/**
 * Error Action type.
 */
const REDUX_WORKER_ERROR = "@@redux-worker/error-action";`
```

```ts
/**
 * Type guard checks if the Action has a Worker Action flag.
 */
const isWorkerAction: <T extends string>(action: AnyAction) => action is Action<T>;
```

```ts
/**
 * Type guard checks for Worker Error Action.
 */
const isErrorAction: (action: AnyAction) => action is Action<'@@redux-worker/error-action'>;
```

```ts
/**
 * Mark any Action as a WorkerAction.
 */
const markWorkerAction: (action: AnyAction) => AnyAction;
```

```ts
/**
 * Worker Actions are sent to the web worker.
 */
const workerActionCreator: <T extends string>(
  type: T,
) => <P, M = undefined>(payload: P, meta?: M) => AnyAction;
```

```ts
/**
 * Function to create Redux Worker middleware.
 */
function createReduxWorkerMiddleware(
  worker: Worker,
  postAll?: boolean,
): {
  reduxWorkerMiddleware: (
    api: MiddlewareAPI<Dispatch<AnyAction>, any>,
  ) => (next: (value: Action<any>) => void) => (action: Action<any>) => void;
  terminate: () => void;
};
```

### Worker

```ts
/**
 * Type guard checks if the action has a ReturnAction flag.
 */
export declare const isReturnAction: <T extends string>(action: any) => action is Action<T>;
```

```ts
/**
 * Mark any Action as a ReturnAction.
 */
export declare const markReturnAction: (action: AnyAction) => AnyAction;
```

```ts
/**
 * Return Actions are sent to the client.
 */
export declare const returnActionCreator: <T extends string>(
  type: T,
) => <P, M = undefined>(payload: P, meta?: M) => AnyAction;
```

```ts
/**
 * The createWorkerStore function is identical to the Redux createStore functon.
 * Except that it automatically includes the middleware to post ReturnActions to the main thread.
 */
const createWorkerStore: StoreCreator;
```

## Webpack

Most likely, you are using Webpack to build your application. You will need to add
`worker-loader` to your config script.

https://github.com/webpack-contrib/worker-loader

While using Workers, you may encounter the error `window is not defined`, especially if
using `new webpack.HotModuleReplacementPlugin()`. To fix it, add `output.globalObject: "this"`
to the Webpack config.

---

## The MIT License (MIT)

Copyright (c) 2018 Patrick Martin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
