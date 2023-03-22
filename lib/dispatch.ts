/**
 * The dispatch function sends a message to be processes in the update function to update the model
 */
export type Dispatch<TMessage> = (message: TMessage) => void;
