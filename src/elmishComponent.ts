// The first attempt at an elmish base component

import { TemplateResult, render } from "lit-html";
import { type Command, type Dispatch } from "./elmish/command";
import command from "./elmish/command";
import { Termination } from "./elmish/program";
import { Queue } from "./elmish/ring";
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
  abstract update(
    message: TMessage,
    model: TModel
  ): [TModel, Command<TMessage>];

  /**
   * Renders the current view based on the current state of the model
   * @param model The current state to render the view with
   * @param dispatch The dispatch function to send messages triggered by user interaction
   */
  abstract view(model: TModel, dispatch: Dispatch<TMessage>): TemplateResult;

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
  subscribe(_: TModel): NewSubscription<TMessage>[] {
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
  onError(message: string, error: unknown) {
    //TODO Figure out something better 😬
    console.error(message, error);
  }

  // ⏬ Styling ⏬
  protected static styles: Promise<CSSStyleSheet>;

  // ⏬ Component lifecycle callbacks ⏬
  connectedCallback() {
    console.debug("Connected");

    // This part is to set up lit rendering
    const shadowRoot = this.attachShadow({ mode: "open" });

    // Set styles as soon as styles are generated
    (this.constructor as typeof ProgramComponent).styles?.then((sheet) =>
      shadowRoot.adoptedStyleSheets.push(sheet)
    );

    // This is from the elmish program loop

    const setState = (model: TModel, dispatch: Dispatch<TMessage>) => {
      //TODO we should probably optimize rendering again based on old and new model
      const template = this.view(model, dispatch);

      render(template, shadowRoot);
    };

    // The program loop but inside the component
    // I might reconsider this and use program module which is called by this component
    // This is a lot of state, I could consider going more in the object oriented way
    // and make a class that contains this
    const [model, initialCommand] = this.initialize();
    const initialSubscription = this.subscribe(model);
    const [isTerminationRequested, terminate] = this.termination;
    let activeSubscriptions: ActiveSubscription[] = [];
    let currentState: TModel = model;

    // Messages need to be processes in the order they arrived (First In, First Out)
    const messageQueue = new Queue<TMessage>();
    // This flag is set while we process messages so we don't
    // start processing messages while already processing
    let isProcessingMessages = false;
    let isTerminated = false;

    // Defined as constant value to have "this" in scope
    const processMessages = () => {
      let nextMessage = messageQueue.dequeue();

      // Stop loop in case of termination
      while (!isTerminated && nextMessage !== undefined) {
        if (isTerminationRequested(nextMessage)) {
          stopSubscriptions(this.onError, activeSubscriptions);
          terminate(currentState);
          // Break out of processing
          return;
        }

        // The update loop. It might add new messages to the message queue
        // when the dispatch callback is invoked.
        // We hand it the first message that is waiting in queue
        const [newState, newCommand] = this.update(nextMessage, currentState);
        // Next we give the component the chance to start subscriptions based on the new state
        // Subscriptions have an id to avoid starting them again
        const subscriptions = this.subscribe(newState);
        // Inside the setState function the program or component can call the view function to render the UI
        setState(newState, dispatch);

        // Execute commands
        command.execute(
          (error) =>
            this.onError(`Error handling the message: ${nextMessage}`, error),
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
          this.onError,
          dispatch,
          difference
        );

        // Complete loop
        nextMessage = messageQueue.dequeue();
      }
    };

    // The dispatch function is how we hook into the loop
    // and provide users a way to update the state
    // to start processing messages if there are new one as long as we are not terminated
    function dispatch(message: TMessage) {
      // Break loop
      if (isTerminated) return;

      // Enqueue messages to be processed
      messageQueue.enqueue(message);
      // Start processing if it hasn't started yet
      if (isProcessingMessages) return;

      isProcessingMessages = true;
      processMessages();
      isProcessingMessages = false;
    }

    // First start of loop
    isProcessingMessages = true;
    setState(model, dispatch);
    command.execute(
      (error) => this.onError(`Error initialzing`, error),
      dispatch,
      initialCommand
    );

    const difference = differentiate<TMessage>(
      activeSubscriptions,
      initialSubscription
    );

    activeSubscriptions = change(this.onError, dispatch, difference);
    processMessages();
    isProcessingMessages = false;
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
