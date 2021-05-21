[asdf](../src/components/GameArea/GameAreaComponent.tsx#L122)

Web Workers Refs:

- https://web.dev/module-workers/
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- for CRA
  - https://medium.com/@bykovskimichael/how-to-use-web-worker-with-create-react-app-e1c1f1ba5279
    - https://github.com/developit/workerize-loader

It is possible to create web workers inline using blobs, see: https://stackoverflow.com/questions/61797408/angular-savely-create-and-dispose-inline-web-workers

However, there may be a significant negative performance impact from frequently instantiating web workers due to the high start-up cost and high memory cost per instance. So we should try to keep one (or very few) long-lived Web Worker/s for common operations with a high computational cost. (e.g. chunk/node generation)

To keep scrolling smooth, we should send a new [`virtualGridDims`](../src/components/GameArea/GameAreaComponent.tsx#L48) as soon as the `onJump` callback is called, and kick off a request to the Web Worker to hydrate the [`virtualNodeDataMap`](../src/components/GameArea/GameAreaComponent.tsx#L52) for the relevant area.  
Q: Should the Web Worker send (postMessage) each node as it is generated, or batch them into ~16ms groups?  
The NodeComponent should have a special loading display for when the nodedata has not been hydrated yet (the hashmap does not have a value for the co-ordinate)
