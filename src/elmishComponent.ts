// The first attempt at an elmish base component

import { TemplateResult, nothing, render } from "lit-html";
import { type Command, type Dispatch } from "./elmish/command";
import command from "./elmish/command";
import { Termination } from "./elmish/program";
import {
  ActiveSubscription,
  change,
  differentiate,
  NewSubscription,
  stopSubscriptions,
} from "./elmish/subscription";

/**
 * A simple component to isolate styles and render html
 */
export abstract class ViewElement extends HTMLElement {
  #shadowRoot: ShadowRoot;
  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: "open" });
    // Set styles as soon as styles are generated
    (this.constructor as typeof ViewElement).styles?.then((sheet) =>
      this.#shadowRoot.adoptedStyleSheets.push(sheet)
    );
  }

  // ⏬ Styling ⏬
  /**
   * Implementing components can use this to add styling to their markup
   */
  protected static styles?: Promise<CSSStyleSheet>;

  abstract view(): TemplateResult | typeof nothing;

  connectedCallback() {
    render(this.view(), this.#shadowRoot);
  }
}

// Not exactly elmish but more like lit-elmish as this relies on lit-html to render the view
//TODO try splitting the program loop things into a mixin class
export default abstract class ElmishElement<
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
  ): TemplateResult | typeof nothing;

  /**
   * Implementing classes can overwrite this method
   * to start subscription to external state changes
   * based on the current state.
   * This is called with each new model to allow users to start subscriptions based on the current state. Subscriptions
   * that are not included but previously were will be stopped.
   * and generated a new model
   * Subscriptions provide an id and subscriptions with
   * the same id will not be started again.
   */
  protected subscribe(model: TModel): NewSubscription<TMessage>[] {
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

  #shadowRoot: ShadowRoot;
  #setState(model: TModel, dispatch: Dispatch<TMessage>) {
    //TODO we should probably optimize rendering again based on old and new model
    // Don't render as long as not connected
    if (!this.isConnected) return;

    const template = this.view(model, dispatch);

    render(template, this.#shadowRoot);
  }

  #messageQueue: TMessage[] = [];
  /**
   * Represents the current state that gets changed constantly
   */
  #currentModel: TModel;
  #activeSubscriptions: ActiveSubscription[] = [];
  #isTerminated;
  #isProcessingMessages = false;

  #processMessages() {
    let nextMessage = this.#messageQueue.shift();
    const [isTerminationRequested, terminate] = this.termination;
    while (!this.#isTerminated && nextMessage !== undefined) {
      if (isTerminationRequested(nextMessage)) {
        stopSubscriptions(this.onError, this.#activeSubscriptions);
        terminate(this.#currentModel);
        // Break out of processing
        break;
      }

      // The update loop. It might add new messages to the message queue
      // when the dispatch callback is invoked.
      // We hand it the first message that is waiting in queue
      const [newState, newCommands] = this.update(
        nextMessage,
        this.#currentModel
      );
      // Next we give the component the chance to start subscriptions based on the new state
      // Subscriptions have an id to avoid starting them again
      const subscriptions = this.subscribe(newState);
      // Inside the setState function the program or component can call the view function to render the UI
      this.#setState(newState, this.dispatch);

      // Execute commands
      command.execute(
        (error) =>
          this.onError(`Error handling the message: ${nextMessage}`, error),
        this.dispatch,
        newCommands
      );

      // Completed run, set new to current
      this.#currentModel = newState;

      // Find subscriptions that need to be started and which ones need to be stopped
      const difference = differentiate<TMessage>(
        this.#activeSubscriptions,
        subscriptions
      );

      // Stops no longer active subscriptions and starts not started ones
      //TODO should dispatch be temporarily go to a buffer to allow setting properties or should view just not be called
      this.#activeSubscriptions = change<TMessage>(
        this.onError,
        this.dispatch,
        difference
      );

      // Complete loop
      nextMessage = this.#messageQueue.shift();
    }
  }

  // ⏬ Properties ⏬
  // ⏬ Styling ⏬
  /**
   * Implementing components can use this to add styling to their markup
   */
  protected static styles?: Promise<CSSStyleSheet>;

  // Defined as property because function is called in constructor through command execute starting side effects and it
  // would have the fields as undefined if this would be a method
  /**
   * The dispatch function is how we hook into the loop and provide users a way to update the state to start processing
   * messages if there are new one as long as we are not terminated
   * @param message
   * @returns
   */
  protected dispatch: Dispatch<TMessage> = (message: TMessage) => {
    // Break loop
    if (this.#isTerminated) return;

    // Enqueue messages to be processed
    this.#messageQueue.push(message);
    // Start processing if it hasn't started yet
    if (this.#isProcessingMessages && this.isConnected) return;

    this.#isProcessingMessages = true;
    this.#processMessages();
    this.#isProcessingMessages = false;
  };

  // ⏬ Component lifecycle callbacks ⏬

  constructor() {
    super();

    // Need to have shadow root initialized before first commands run
    this.#shadowRoot = this.attachShadow({ mode: "open" });
    this.#isTerminated = false;
    const [initialModal, initialCommands] = this.initialize();
    this.#currentModel = initialModal;
    const initialSubscriptions = this.subscribe(this.#currentModel);
    command.execute(
      (error) => this.onError(`Error initialzing`, error),
      this.dispatch,
      initialCommands
    );

    const difference = differentiate<TMessage>(
      this.#activeSubscriptions,
      initialSubscriptions
    );

    // Stops no longer active subscriptions and starts not started ones
    //TODO should dispatch be temporarily go to a buffer to allow setting properties or should view just not be called
    this.#activeSubscriptions = change<TMessage>(
      this.onError,
      this.dispatch,
      difference
    );

    // Set styles as soon as styles are generated
    (this.constructor as typeof ElmishElement).styles?.then((sheet) =>
      this.#shadowRoot.adoptedStyleSheets.push(sheet)
    );
  }

  // Attributes defined in the DOM are not available in the constructor and only at connected time
  connectedCallback() {
    // Start program loop
    // Start first loop
    if (!this.isConnected || !this.isConnected) return;

    this.#setState(this.#currentModel, this.dispatch);
    this.#isProcessingMessages = true;
    this.#processMessages();
    this.#isProcessingMessages = false;
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
