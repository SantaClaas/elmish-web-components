// Can't I import the types and consts separately with namespace and without? 🤔
import { Command, execute, type Dispatch } from "./command";
import { HandleErrorFunction } from "./error";
import { Queue } from "./ring";
import {
  type None,
  none,
  differentiate,
  change,
  stopSubscriptions,
  ActiveSubscription,
  NewSubscription,
} from "./subscription";

// Me trying to copy https://github.com/elmish/elmish to TypeScript:
/**
 * Me trying to copy https://github.com/elmish/elmish to TypeScript:
 * (I prefer no abbreviations though...)
 */

export type InitializeFunction<TArgument, TModel, TMessage> = (
  argument: TArgument
) => [TModel, Command<TMessage>];

type UpdateFunction<TModel, TMessage> = (
  message: TMessage,
  model: TModel
) => [TModel, Command<TMessage>];

type ViewFunction<TModel, TMessage, TView> = (
  model: TModel,
  dispatch: Dispatch<TMessage>
) => TView;

type SubscribeFunction<TModel, TMessage> = (
  model: TModel
) => NewSubscription<TMessage>[];

type Predicate<TMessage> = (message: TMessage) => boolean;
type HandleTerminateFunction<TModel> = (model: TModel) => void;

type Termination<TMessage, TModel> = [
  Predicate<TMessage>,
  HandleTerminateFunction<TModel>
];

type MapFunction<TValue> = (value: TValue) => TValue;

type SetStateFunction<TModel, TMessage> = (
  model: TModel,
  dispatch: Dispatch<TMessage>
) => void;

type Program<TArgument, TModel, TMessage, TView> = {
  // Initializes the initial state of the application and starts side effects
  readonly initialize: InitializeFunction<TArgument, TModel, TMessage>;
  // Is called when a message is dispatched
  readonly update: UpdateFunction<TModel, TMessage>;
  readonly view: ViewFunction<TModel, TMessage, TView>;
  // Subscribe to changes to the applications state from outside of the application.
  // The difference to dispatch is that these changes are not triggered by the application
  readonly subscribe: SubscribeFunction<TModel, TMessage>;
  // Need to research what these are again 😬
  readonly setState: SetStateFunction<TModel, TMessage>;
  // This was for error logging or something 🤔
  // The argument type is string*exception. Not sure what the string was. I assume a message?
  readonly onError: HandleErrorFunction;
  // Not sure here either 😬
  // Probably something related to the shutdown (https://elmish.github.io/elmish/#controlling-termination 👀❓)
  readonly termination: Termination<TMessage, TModel>;
};

export function makeProgram<TArgument, TModel, TMessage, TView>(
  initialize: InitializeFunction<TArgument, TModel, TMessage>,
  update: UpdateFunction<TModel, TMessage>,
  view: ViewFunction<TModel, TMessage, TView>
): Program<TArgument, TModel, TMessage, TView> {
  return {
    initialize,
    update,
    view,
    setState: (model, dispatch) => view(model, dispatch),
    subscribe: (_) => none,
    onError: (message, error) => console.error(error, message),
    termination: [(_) => false, () => {}],
  };
}

// Takes out some of the configurability of creating a program in favor of simplicity. Good for beginners.
function makeSimple<TArgument, TModel, TMessage, TView>(
  initalize: (argument: TArgument) => TModel,
  update: (message: TMessage, model: TModel) => TModel,
  view: ViewFunction<TModel, TMessage, TView>
): Program<TArgument, TModel, TMessage, TView> {
  return {
    initialize: (argument: TArgument) => [initalize(argument), [] as None],
    update: (message: TMessage, model: TModel): [TModel, Command<TMessage>] => [
      update(message, model),
      [] as None,
    ],
    view,
    setState: (model, dispatch) => view(model, dispatch),
    subscribe: (_) => none,
    onError: (message, error) => console.error(error, message),
    termination: [(_) => false, () => {}],
  };
}
/**
 * Subscribe to external source of events, overrides existing subscription.
 * Return the subscriptions that should be active based on the current model.
 * Subscriptions will be started or stopped automatically to match.
 * @param subscribe
 * @param program
 * @returns
 */
function withSubscription<TArgument, TModel, TMessage, TView>(
  subscribe: SubscribeFunction<TModel, TMessage>,
  program: Program<TArgument, TModel, TMessage, TView>
): Program<TArgument, TModel, TMessage, TView> {
  return {
    ...program,
    subscribe,
  };
}

/**
 * Trace all the updates to the console. This makes debugging easier. Recommened to be used only during development as JS peeps don't like console logs in production apparently
 * @param program
 */
function withConsoleTrace<TArgument, TModel, TMessage, TView>(
  program: Program<TArgument, TModel, TMessage, TView>
) {
  //TODO add nice and fancy CSS styled console logs with table and stuff
  // https://developer.mozilla.org/en-US/docs/Web/API/console/
  function traceInitialization(argument: TArgument) {
    const [initialModel, command] = program.initialize(argument);
    console.log("Initial state: ", initialModel);
    return [initialModel, command];
  }

  function traceUpdate(message: TMessage, model: TModel) {
    //TODO should probably combine both logs
    // like use console.group()
    console.log("New message: ", message);
    const [newModel, command] = program.update(message, model);
    console.log("Updated state: ", newModel);
    return [newModel, command];
  }

  function traceSubscribe(model: TModel) {
    const subscriptions = program.subscribe(model);
    console.log(
      "Updated subscriptions: ",
      subscriptions.map(({ id }: NewSubscription<TMessage>) => id)
    );

    return subscriptions;
  }

  return {
    ...program,
    initialize: traceInitialization,
    update: traceUpdate,
    subscribe: traceSubscribe,
  };
}

function withErrorHandler<TArgument, TModel, TMessage, TView>(
  onError: HandleErrorFunction,
  program: Program<TArgument, TModel, TMessage, TView>
) {
  return {
    ...program,
    onError,
  };
}

function withTermination<TArgument, TModel, TMessage, TView>(
  predicate: Predicate<TMessage>,
  terminate: HandleTerminateFunction<TModel>,
  program: Program<TArgument, TModel, TMessage, TView>
) {
  return {
    ...program,
    termination: [predicate, terminate],
  };
}

function mapTermination<TArgument, TModel, TMessage, TView>(
  map: MapFunction<Termination<TMessage, TModel>>,
  program: Program<TArgument, TModel, TMessage, TView>
) {
  return {
    ...program,
    termination: map(program.termination),
  };
}

function mapErrorHandler<TArgument, TModel, TMessage, TView>(
  map: MapFunction<HandleErrorFunction>,
  program: Program<TArgument, TModel, TMessage, TView>
) {
  return {
    ...program,
    onError: map(program.onError),
  };
}

function onError<TArgument, TModel, TMessage, TView>(
  program: Program<TArgument, TModel, TMessage, TView>
) {
  return program.onError;
}

function withSetState<TArgument, TModel, TMessage, TView>(
  setState: SetStateFunction<TModel, TMessage>,
  program: Program<TArgument, TModel, TMessage, TView>
) {
  return {
    ...program,
    setState,
  };
}

function setState<TArgument, TModel, TMessage, TView>(
  program: Program<TArgument, TModel, TMessage, TView>
) {
  return program.setState;
}

function view<TArgument, TModel, TMessage, TView>(
  program: Program<TArgument, TModel, TMessage, TView>
) {
  return program.view;
}

function initialize<TArgument, TModel, TMessage, TView>(
  program: Program<TArgument, TModel, TMessage, TView>
) {
  return program.initialize;
}

function update<TArgument, TModel, TMessage, TView>(
  program: Program<TArgument, TModel, TMessage, TView>
) {
  return program.update;
}
function map<TArgument, TModel, TMessage, TView>(
  map: MapFunction<Program<TArgument, TModel, TMessage, TView>>,
  program: Program<TArgument, TModel, TMessage, TView>
) {
  return map(program);
}

// The id / identity function. Returns what is given, no joke, pretty useful
function identity<TValue>(value: TValue) {
  return value;
}

function runWithDispatch<TArgument, TModel, TMessage, TView>(
  syncDispatch: (dispatch: Dispatch<TMessage>) => Dispatch<TMessage>,
  argument: TArgument,
  program: Program<TArgument, TModel, TMessage, TView>
) {
  const [model, command] = program.initialize(argument);
  const subscription = program.subscribe(model);
  const [toTerminate, terminate] = program.termination;
  // const ringBuffer = new RingBuffer<TMessage>(10);
  // Ring/Circular buffer seems to be an optimization and it should behave like a queue
  // So unitl I have fixed the bug in my implementation of it, I'll use a queue which is easier to understand 😅
  // On the other hand I could just put more research in it to understand the ring buffer. Will do when out of Proof of Concept phase.
  const messageQueue = new Queue<TMessage>();
  let isReentered = false;
  let state = model;
  let activeSubscriptions: ActiveSubscription[] = [];
  let isTerminated = false;

  // How good is JS with recursion? Or should I make this into a loop?
  function dispatch(message: TMessage) {
    if (isTerminated) return;

    // ringBuffer.push(message);
    messageQueue.enqueue(message);
    if (isReentered) return;

    isReentered = true;
    processMessages();
    isReentered = false;
  }

  // Idk why it is serialized
  function serializedDispatch(message: TMessage) {
    return syncDispatch(dispatch)(message);
  }
  function processMessages() {
    // let nextMessage = ringBuffer.pop();
    let nextMessage = messageQueue.dequeue();
    while (!isTerminated && nextMessage) {
      // Is there a possibility to terminate multiple times?
      if (toTerminate(nextMessage)) {
        stopSubscriptions(program.onError, activeSubscriptions);
        terminate(state);
        isTerminated = true;
      } else {
        const [newState, command] = program.update(nextMessage, state);
        const subscriptions = program.subscribe(newState);
        program.setState(newState, serializedDispatch);
        execute(
          (error) =>
            program.onError(
              `Error handling the message: ${nextMessage}`,
              error
            ),
          dispatch,
          command
        );

        state = newState;
        // Doing a step in between compared to original because we don't have the pipe operator
        const differentiationState = differentiate<TMessage>(
          activeSubscriptions,
          subscriptions
        );

        activeSubscriptions = change<TMessage>(
          program.onError,
          dispatch,
          differentiationState
        );

        // nextMessage = ringBuffer.pop();
        nextMessage = messageQueue.dequeue();
      }
    }
  }

  isReentered = true;
  program.setState(model, serializedDispatch);
  execute(
    (error) => program.onError(`Error initializing command: ${command}`, error),
    serializedDispatch,
    command
  );
  // Step inbetween becasue no pipe operator
  const differentiationResult = differentiate<TMessage>(
    activeSubscriptions,
    subscription
  );
  change(program.onError, serializedDispatch, differentiationResult);
  processMessages();
  isReentered = false;
}

export function runWith<TArgument, TModel, TMessage, TView>(
  argument: TArgument,
  program: Program<TArgument, TModel, TMessage, TView>
) {
  runWithDispatch(identity, argument, program);
}

function run<TModel, TMessage, TView>(
  program: Program<null, TModel, TMessage, TView>
) {
  runWith(null, program);
}
