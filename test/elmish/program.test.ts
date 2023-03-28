import { batch, Command, ofMessage } from "../../src/elmish/command";
import { expect, test } from "vitest";
import {
  InitializeFunction,
  makeProgram,
  runWith,
} from "../../src/elmish/program";

type Model = number;

type Message = "Increment" | "Decrement" | "Increment10Times";

function update(message: Message, model: Model): [Model, Command<Message>] {
  switch (message) {
    case "Decrement":
      return [model - 1, []];
    case "Increment":
      return [model + 1, []];
    case "Increment10Times":
      return [
        model,
        batch([...Array(10)].map(() => ofMessage<Message>("Increment"))),
      ];
  }
}

function initialize(argument: Message[]): [Model, Command<Message>] {
  const command = batch(argument.map(ofMessage));

  return [0, command];
}

//TODO use mocking and add multiple runs like in elmish
test("Program should dispatch batch", async () => {
  // Arrange
  function createRandomMessage(): Message {
    const number = Math.floor(Math.random() * 3);
    switch (number) {
      case 0:
        return "Decrement";
      case 1:
        return "Increment";
      case 2:
        return "Increment10Times";
      default:
        throw `Didn't expect ${number}`;
    }
  }
  const randomMessages = [...Array(10)].map(createRandomMessage);
  const expectedCount = randomMessages.reduce((sum, message) => {
    switch (message) {
      case "Decrement":
        return sum - 1;
      case "Increment":
        return sum + 1;
      case "Increment10Times":
        return sum + 10;
    }
  }, 0);

  // Our "view"
  let counted = 0;
  function count(model: Model) {
    counted = model;
  }

  // Act
  // Argument is message array
  const program = makeProgram<Message[], Model, Message, void>(
    initialize,
    update,
    count
  );
  // Need to run separately because it runs forever
  const timeOutPromise = new Promise<void>((resolve) =>
    setTimeout(() => resolve(), 1_000)
  );

  const programPromise = new Promise<void>(() => {
    runWith(randomMessages, program);
  });

  await Promise.race([timeOutPromise, programPromise]);

  // Assert
  expect(expectedCount).toBe(counted);
});
