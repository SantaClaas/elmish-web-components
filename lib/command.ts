// For side effects

export type None = null;
/**
 * Commands are carriers of instructions, which you issue from the init and update functions. Once evaluated, a command may produce one or more new messages, mapping success or failure as instructed ahead of time. As with any message dispatch, in the case of Parent-Child composition, child commands need to be mapped to the parent's type
 * From https://elmish.github.io/elmish/#commands
 */
export type Command<TMessage> = (() => TMessage) | None;

export const none: None = null;
