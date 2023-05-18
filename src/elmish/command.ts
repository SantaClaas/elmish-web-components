// Commmands are used for side effects
/**
 * The dispatch function sends a message to be processes in the update function to update the model
 */
export type Dispatch<TMessage> = (message: TMessage) => void;

export type Effect<TMessage> = (dispatch: Dispatch<TMessage>) => void;
/**
 * Commands are carriers of instructions, which you issue from the init and update functions. Once evaluated, a command may produce one or more new messages, mapping success or failure as instructed ahead of time. As with any message dispatch, in the case of Parent-Child composition, child commands need to be mapped to the parent's type
 * From https://elmish.github.io/elmish/#commands
 */
export type Command<TMessage> = Array<Effect<TMessage>>;

/**
 * None - no commands, also known as `[]`
 */
export const none = [];

/**
 * Execute the commands using the supplied dispatcher
 * @internal
 */
export function execute<TMessage>(
  onError: (error: unknown) => void,
  dispatch: Dispatch<TMessage>,
  command: Command<TMessage>
) {
  command.forEach((call) => {
    try {
      call(dispatch);
    } catch (error: unknown) {
      onError(error);
    }
  });
}

export function map<TMessageA, TMessageB>(
  mapper: (message: TMessageA) => TMessageB,
  command: Command<TMessageA>
): Command<TMessageB> {
  // I'm sorry this is a bit harder to read. If you find a solution that is easier to read and maps one message type to
  // the other please contribute
  return command.map((effect): Effect<TMessageB> => {
    const newEffect = (dispatchB: Dispatch<TMessageB>) => {
      const newDispatch = (messageA: TMessageA) => {
        dispatchB(mapper(messageA));
      };
      effect(newDispatch);
    };
    return newEffect;
  });
}

/**
 * Aggregate multiple commands
 */
export function batch<TMessage>(
  commands: Iterable<Command<TMessage>>
): Command<TMessage> {
  return Array.from(commands).flat();
}

/**
 * Command to call the effect
 */
export function ofEffect<TMessage>(
  effect: Effect<TMessage>
): Command<TMessage> {
  return [effect];
}

export const ofFunction = {
  /**
   * Command to evaluate a simple function and map the result
   * into success or error (of exception)
   */
  either<TArgument, TResult, TMessage>(
    task: (argument: TArgument) => TResult,
    argument: TArgument,
    ofSuccess: (result: TResult) => TMessage,
    ofError: (error: unknown) => TMessage
  ): Command<TMessage> {
    function bind(dispatch: Dispatch<TMessage>) {
      try {
        const result = task(argument);
        const message = ofSuccess(result);
        dispatch(message);
      } catch (error: unknown) {
        const message = ofError(error);
        dispatch(message);
      }
    }

    return [bind];
  },

  /**
   * Command to evaluate a simple function and map the success to a message
   * discarding any possible error
   */
  perform<TArgument, TResult, TMessage>(
    task: (argument: TArgument) => TResult,
    argument: TArgument,
    ofSuccess: (result: TResult) => TMessage
  ): Command<TMessage> {
    function bind(dispatch: Dispatch<TMessage>) {
      try {
        const result = task(argument);
        const message = ofSuccess(result);
        dispatch(message);
      } catch (_) {
        // Yup, this ignores errors
      }
    }

    return [bind];
  },

  /**
   * Command to evaluate a simple function and map the error (in case of exception)
   */
  attempt<TArgument, TMessage>(
    task: (argument: TArgument) => void,
    argument: TArgument,
    ofError: (error: unknown) => TMessage
  ): Command<TMessage> {
    function bind(dispatch: Dispatch<TMessage>) {
      try {
        task(argument);
      } catch (error: unknown) {
        const message = ofError(error);
        dispatch(message);
      }
    }

    return [bind];
  },
};

// Port note: Changed 'Async' and 'Task' to JS terms which is 'Promise'
// This "module" uses a lot of "fire and forget" but we catch the errors
export const ofPromise = {
  /**
   * Command that will evaluate an async block and map the result
   * into success or error (of exception)
   */
  either<TArgument, TResult, TMessage>(
    task: (argument: TArgument) => Promise<TResult>,
    argument: TArgument,
    ofSuccess: (result: TResult) => TMessage,
    ofError: (error: unknown) => TMessage
  ): Command<TMessage> {
    async function bind(dispatch: Dispatch<TMessage>): Promise<void> {
      try {
        const result = await task(argument);
        const message = ofSuccess(result);
        dispatch(message);
      } catch (error) {
        const message = ofError(error);
        dispatch(message);
      }
    }

    return [bind];
  },

  /**
   * Command that will evaluate an async block and map the success
   */
  perform<TArgument, TResult, TMessage>(
    task: (argument: TArgument) => Promise<TResult>,
    argument: TArgument,
    ofSuccess: (result: TResult) => TMessage
  ): Command<TMessage> {
    async function bind(dispatch: Dispatch<TMessage>): Promise<void> {
      try {
        const result = await task(argument);
        const message = ofSuccess(result);
        dispatch(message);
      } catch (e) {
        // Ignored
        console.error("Ignored error:", e);
      }
    }

    // F# has a nice syntax for chaining functions to create a new function `bind >> start`
    return [bind];
  },

  /**
   *  Command that will evaluate an async block and map the error (of exception)
   */
  attempt<TArgument, TMessage>(
    task: (argument: TArgument) => Promise<void>,
    argument: TArgument,
    ofError: (error: unknown) => TMessage
  ): Command<TMessage> {
    async function bind(dispatch: Dispatch<TMessage>): Promise<void> {
      try {
        await task(argument);
      } catch (error) {
        const message = ofError(error);
        dispatch(message);
      }
    }

    // F# has a nice syntax for chaining functions to create a new function `bind >> start`
    return [bind];
  },
};

/**
 * Command to issue a specific message
 */
export function ofMessage<TMessage>(message: TMessage): Command<TMessage> {
  // A command is just an array of effects
  return [(dispatch: Dispatch<TMessage>) => dispatch(message)];
}

const command = {
  execute,
  none,
  map,
  ofMessage,
  ofPromise,
  ofFunction,
  batch,
  ofEffect,
};
export default command;
