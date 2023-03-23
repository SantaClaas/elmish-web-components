import { assert, expect, test } from "vitest";
import { Queue, RingBuffer } from "../lib/ring";

type Pop = { type: "Operation.Pop" };
type Push = { type: "Operation.Push"; positiveNumber: number };
type Operation = Pop | Push;

// 💩
type Pooped = { type: "OperationResult.Pooped"; positiveNumber?: number };
type Pushed = { type: "OperationResult.Pushed" };
type OperationResult = Pooped | Pushed;

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

//TODO use test each from vitest
//TODO fix ring buffer implementation
// This might be prone to error since it is testing our implementation against our implementation
test.skip("Ring buffer should act like a queue", () => {
  for (let length = 1; length <= 1_000; length++) {
    // Arrange
    const queue: Queue<number> = new Queue<number>();
    const ringBuffer = new RingBuffer<number>(10);

    const operations: Operation[] = [];
    const getRandomNumber = () => Math.floor(Math.random() * 1000);
    for (let index = 0; index < length; index++) {
      const operation: Operation =
        Math.random() > 0.5
          ? { type: "Operation.Pop" }
          : { type: "Operation.Push", positiveNumber: getRandomNumber() };

      operations.push(operation);
    }

    // Act
    const queueResults = applyQueueOperations(operations, queue);
    const bufferResults = applyRingBufferOperations(operations, ringBuffer);

    // Assert
    expect(queueResults.length).toBe(bufferResults.length);

    for (let index = 0; index < queueResults.length; index++) {
      const queueResult = queueResults[index];
      const bufferResult = bufferResults[index];

      expect(queueResult).toHaveProperty("type");
      expect(queueResult.type, `oh ${queueResult}`).toBe(bufferResult.type);
      // Second condition will be always true but TypeScript doesn't know so we check again
      if (
        queueResult.type === "OperationResult.Pooped" &&
        bufferResult.type === "OperationResult.Pooped"
      )
        expect(queueResult.positiveNumber).toBe(bufferResult.positiveNumber);
    }
  }
});

test("My queue implementation should enqueue and dequeue in the right order", () => {
  // Arrange
  const queue = new Queue<number>();

  // Act
  queue.enqueue(1);
  queue.enqueue(2);
  queue.enqueue(3);
  queue.enqueue(4);

  expect(queue.dequeue()).toBe(1);
  expect(queue.dequeue()).toBe(2);
  expect(queue.dequeue()).toBe(3);
  expect(queue.dequeue()).toBe(4);
});
