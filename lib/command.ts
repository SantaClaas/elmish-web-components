// For side effects
export type None = [];

/**
 * The dispatch function sends a message to be processes in the update function to update the model
 */
export type Dispatch<TMessage> = (message: TMessage) => void;

export type Effect<TMessage> = (dispatch: Dispatch<TMessage>) => void;
/**
 * Commands are carriers of instructions, which you issue from the init and update functions. Once evaluated, a command may produce one or more new messages, mapping success or failure as instructed ahead of time. As with any message dispatch, in the case of Parent-Child composition, child commands need to be mapped to the parent's type
 * From https://elmish.github.io/elmish/#commands
 */
export type Command<TMessage> = Array<Effect<TMessage>> | None;

//TODO internal
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
