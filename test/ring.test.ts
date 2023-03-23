import { assert, expect, test } from "vitest";
import { RingBuffer } from "../lib/ring";

type Pop = { type: "Operation.Pop" };
type Push = { type: "Operation.Push"; positiveNumber: number };
type Operation = Pop | Push;

// 💩
type Pooped = { type: "OperationResult.Pooped"; positiveNumber?: number };
type Pushed = { type: "OperationResult.Pushed" };
type OperationResult = Pooped | Pushed;

class Queue<T> {
  #values: Array<T> = [];

  dequeue() {
    if (this.#values.length === 0) return undefined;

    // First index is first element. Last index is last element.
    const value = this.#values[0];

    // Remove and reduce size
    this.#values = this.#values.length === 1 ? [] : this.#values.slice(1);

    return value;
  }

  enqueue(value: T) {
    this.#values.push(value);
  }
}

function applyQueueOperations(operations: Operation[], queue: Queue<number>) {
  return operations.map((operation): OperationResult => {
    switch (operation.type) {
      case "Operation.Pop":
        const result = queue.dequeue();
        return { type: "OperationResult.Pooped", positiveNumber: result };
      case "Operation.Push":
        queue.enqueue(operation.positiveNumber);
        return { type: "OperationResult.Pushed" };
    }
  });
}

function applyRingBufferOperations(
  operations: Operation[],
  ringBuffer: RingBuffer<number>
) {
  return operations.map((operation): OperationResult => {
    switch (operation.type) {
      case "Operation.Pop":
        const result = ringBuffer.pop();
        return { type: "OperationResult.Pooped", positiveNumber: result };
      case "Operation.Push":
        ringBuffer.push(operation.positiveNumber);
        return { type: "OperationResult.Pushed" };
    }
  });
}

// This might be prone to error since it is testing our implementation against our implementation
test("Ring buffer should act like a queue", () => {
  for (let length = 1; length <= 1_000; length++) {
    const queue: Queue<number> = new Queue<number>();
    const ringBuffer = new RingBuffer(10);
    const data = Array(length).map(() => Math.floor(Math.random() * 100)).map(number => );

    // const resultQueue = applyQueueOperations(oper);
  }
});
