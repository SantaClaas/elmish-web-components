// The first attempt at an elmish base component

import { TemplateResult, render } from "lit-html";
import { type Command, type Dispatch } from "./elmish/command";
import command from "./elmish/command";
import { Termination, makeProgram, run } from "./elmish/program";
import {
  ActiveSubscription,
  change,
  differentiate,
  NewSubscription,
  stopSubscriptions,
} from "./elmish/subscription";

// Not exactly elmish but more like lit-elmish as this relies on lit-html to render the view
export default abstract class ProgramComponent<
  TModel,
  TMessage
> extends HTMLElement {
  // ⏬ Elmish ⏬
  /**
   * Gets called once at the start of the components lifecycle and can be overwritten to provide the
   */
  abstract initialize(): [TModel, Command<TMessage>];
  /**
   * The update function get's the current state encapsulated in the model and a message disptached from the view to update the model based on the message
   * Or start commands for side effects
   * @param message The message dispatched from the view to update model (or not, you don't have to)
   * @param model The current state of the component
   */
  protected update(
    message: TMessage,
    model: TModel
  ): [TModel, Command<TMessage>] {
    return [model, command.none];
  }

  /**
   * Renders the current view based on the current state of the model
   * @param model The current state to render the view with
   * @param dispatch The dispatch function to send messages triggered by user interaction
   */
  protected abstract view(
    model: TModel,
    dispatch: Dispatch<TMessage>
  ): TemplateResult;

  /**
   * Implementing classes can overwrite this method
   * to start subscription to external state changes
   * based on the current state.
   * This is called after the update method was invoked
   * and generated a new model
   * Subscriptions provide an id and subscriptions with
   * the same id will not be started again.
   * Subscriptions that were returned at one point but weren't at the next point will be stopped.
   */
  protected subscribe(_: TModel): NewSubscription<TMessage>[] {
    return [];
  }

  //TODO should this hook into connection callbacks?
  /**
   * Implementing classes can overwrite this to configure when termination should occur
   * and to react to termination.
   * The should terminate predicate function gets hooked into the update loop and receives
   * messages based on which it can decide if termination should begin.
   * After termination has begun the terminate callback will be invoked to give implementers
   * the chance for clean up
   */
  termination: Termination<TMessage, TModel> = [(_) => false, () => {}];

  // Error handling callback
  //TODO this is copied from program which has a callback defined but there might be a better approach
  protected onError(message: string, error: unknown) {
    //TODO Figure out something better 😬
    console.error(message, error);
  }

  // ⏬ Styling ⏬
  /**
   * Implementing components can use this to add styling to their markup
   */
  protected static styles?: Promise<CSSStyleSheet>;

  // ⏬ Component lifecycle callbacks ⏬
  connectedCallback() {
    console.debug("Connected");

    const shadowRoot = this.attachShadow({ mode: "open" });

    // Set styles as soon as styles are generated
    (this.constructor as typeof ProgramComponent).styles?.then((sheet) =>
      shadowRoot.adoptedStyleSheets.push(sheet)
    );

    const setState = (model: TModel, dispatch: Dispatch<TMessage>) => {
      //TODO we should probably optimize rendering again based on old and new model
      const template = this.view(model, dispatch);

      render(template, shadowRoot);
    };

    // This is from the elmish program loop
    const program = makeProgram(this.initialize, this.update, setState);

    run(program);
  }

  disconnectedCallback() {
    console.debug("Disconected");
    // Stop subscriptions?
    // Clean up?
  }

  adoptedCallback() {
    console.debug("Adopted");
    // Reset model?
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string
  ) {
    console.debug("Attribute changed", { name, oldValue, newValue });
    // Run attribute changed subscriptions that listen to the attribute?
  }

  static get observedAttributes() {
    console.debug("Get observed attributes");
    // Get subscriptions to attribute changes and the names of their attributes to return them here
    return ["value"];
  }
}
