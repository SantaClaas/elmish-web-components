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

/**
 * Command to issue a specific message
 */
export function ofMessage<TMessage>(message: TMessage): Command<TMessage> {
  // A command is just an array of effects
  return [(dispatch: Dispatch<TMessage>) => dispatch(message)];
}
