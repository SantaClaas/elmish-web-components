import { Dispatch, type Command } from "./command";

export abstract class ElmishComponent<TModel, TMessage> extends HTMLElement {
  /**
   * The update function get's the current state encapsulated in the model and a message disptached from the view to update the model based on the message
   * Or start commands for side effects
   * @param model The current state of the component
   * @param message The message dispatched from the view to update model (or not, you don't have to)
   */
  abstract update(
    model: TModel,
    message: TMessage
  ): [TModel, Command<TMessage>];

  /**
   * Renders the current view based on the current state of the model
   * @param model The current state to render the view with
   * @param dispatch The dispatch function to send messages triggered by user interaction
   */
  abstract view(model: TModel, dispatch: Dispatch<TMessage>): string;
}
