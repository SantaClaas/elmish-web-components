// Can't I import the types and consts separately with namespace and without? 🤔
import * as command from "./command";
import { type Dispatch } from "./dispatch";
import {
  type Subscription,
  type None,
  none,
  SubscriptionId,
  Subscribe,
} from "./subscription";

// Me trying to copy https://github.com/elmish/elmish to TypeScript:
/**
 * Me trying to copy https://github.com/elmish/elmish to TypeScript:
 * (I prefer no abbreviations though...)
 */

type InitializeFunction<TArgument, TModel, TMessage> = (
  argument: TArgument
) => [TModel, command.Command<TMessage>];

type UpdateFunction<TModel, TMessage> = (
  message: TMessage,
  model: TModel
) => [TModel, command.Command<TMessage>];

type ViewFunction<TModel, TMessage, TView> = (
  model: TModel,
  dispatch: Dispatch<TMessage>
) => TView;

type SubscribeFunction<TModel, TMessage> = (
  model: TModel
) => Subscription<TMessage>;

type Program<TArgument, TModel, TMessage, TView> = {
  // Initializes the initial state of the application and starts side effects
  initialize: InitializeFunction<TArgument, TModel, TMessage>;
  // Is called when a message is dispatched
  update: UpdateFunction<TModel, TMessage>;
  view: ViewFunction<TModel, TMessage, TView>;
  // Subscribe to changes to the applications state from outside of the application.
  // The difference to dispatch is that these changes are not triggered by the application
  subscribe: SubscribeFunction<TModel, TMessage>;
  // Need to research what these are again 😬
  setState: (model: TModel, dispatch: Dispatch<TMessage>) => void;
  // This was for error logging or something 🤔
  // The argument type is string*exception. Not sure what the string was. I assume a message?
  onError: (message: string, error: Error) => void;
  // Not sure here either 😬
  // Probably something related to the shutdown (https://elmish.github.io/elmish/#controlling-termination 👀❓)
  termination: [(message: TMessage) => boolean, (model: TModel) => void];
};

function makeProgram<TArgument, TModel, TMessage, TView>(
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
    initialize: (argument: TArgument) => [initalize(argument), command.none],
    update: (
      message: TMessage,
      model: TModel
    ): [TModel, command.Command<TMessage>] => [
      update(message, model),
      command.none,
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
      subscriptions.map(([id]: [SubscriptionId, Subscribe<TMessage>]) => id)
    );
  }
}
