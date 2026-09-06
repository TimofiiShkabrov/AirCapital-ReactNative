export function serialQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(operation: () => Promise<T>): Promise<T> => {
    const result = tail.then(operation, operation);
    tail = result.catch(() => undefined);
    return result;
  };
}

// Shared by whole record mutations, imports and deletion. Do not nest this queue.
export const dataQueue = serialQueue();
