// Can't I import the types and consts separately with namespace and without? 🤔
import { type Command, type Dispatch } from "./command";
import command from "./command";
import { HandleErrorFunction } from "./error";
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

type ShouldTerminate<TMessage> = (message: TMessage) => boolean;
type HandleTerminateFunction<TModel> = (model: TModel) => void;

export type Termination<TMessage, TModel> = [
  ShouldTerminate<TMessage>,
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
  predicate: ShouldTerminate<TMessage>,
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
  argument: TArgument,
  program: Program<TArgument, TModel, TMessage, TView>
) {
  const [model, initialCommand] = program.initialize(argument);
  const initialSubscription = program.subscribe(model);
  const [isTerminationRequested, terminate] = program.termination;
  let activeSubscriptions: ActiveSubscription[] = [];
  let currentState: TModel = model;

  // Messages need to be processes in the order they arrived (First In, First Out)
  const messageQueue: TMessage[] = [];
  // This flag is set while we process messages so we don't
  // start processing messages while already processing
  let isProcessingMessages = false;
  let isTerminated = false;

  // Defined as constant value to have "this" in scope
  const processMessages = () => {
    let nextMessage = messageQueue.shift();

    // Stop loop in case of termination
    while (!isTerminated && nextMessage !== undefined) {
      if (isTerminationRequested(nextMessage)) {
        stopSubscriptions(program.onError, activeSubscriptions);
        terminate(currentState);
        // Break out of processing
        return;
      }

      // The update loop. It might add new messages to the message queue
      // when the dispatch callback is invoked.
      // We hand it the first message that is waiting in queue
      const [newState, newCommand] = program.update(nextMessage, currentState);
      // Next we give the component the chance to start subscriptions based on the new state
      // Subscriptions have an id to avoid starting them again
      const subscriptions = program.subscribe(newState);
      // Inside the setState function the program or component can call the view function to render the UI
      program.setState(newState, dispatch);

      // Execute commands
      command.execute(
        (error) =>
          program.onError(`Error handling the message: ${nextMessage}`, error),
        dispatch,
        newCommand
      );

      // Completed run, set new to current
      currentState = newState;

      // Find subscriptions that need to be started and which ones need to be stopped
      const difference = differentiate<TMessage>(
        activeSubscriptions,
        subscriptions
      );

      // Stops no longer active subscriptions and starts not started ones
      activeSubscriptions = change<TMessage>(
        program.onError,
        dispatch,
        difference
      );

      // Complete loop
      nextMessage = messageQueue.shift();
    }
  };

  // The dispatch function is how we hook into the loop
  // and provide users a way to update the state
  // to start processing messages if there are new one as long as we are not terminated
  function dispatch(message: TMessage) {
    // Break loop
    if (isTerminated) return;

    // Enqueue messages to be processed
    messageQueue.push(message);
    // Start processing if it hasn't started yet
    if (isProcessingMessages) return;

    isProcessingMessages = true;
    processMessages();
    isProcessingMessages = false;
  }

  // First start of loop
  isProcessingMessages = true;
  program.setState(model, dispatch);
  command.execute(
    (error) => program.onError(`Error initialzing`, error),
    dispatch,
    initialCommand
  );

  const difference = differentiate<TMessage>(
    activeSubscriptions,
    initialSubscription
  );

  activeSubscriptions = change(program.onError, dispatch, difference);
  processMessages();
  isProcessingMessages = false;
}

export function runWith<TArgument, TModel, TMessage, TView>(
  argument: TArgument,
  program: Program<TArgument, TModel, TMessage, TView>
) {
  runWithDispatch(argument, program);
}

export function run<TModel, TMessage, TView>(
  program: Program<null, TModel, TMessage, TView>
) {
  runWith(null, program);
}
