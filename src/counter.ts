// A typical counter component implementation to try implementing elmish

import { Command, Dispatch } from "../lib/command";

// Could also just say model is an alias for type number but this is clearer IMO
type CounterModel = {
  readonly count: number;
};

type CounterMessage = "Increase" | "Decrease";

export default class ElmishCounter extends HTMLElement {
  // ⏬ Elmish ⏬
  initialize(): [CounterModel, Command<CounterMessage>] {
    return [{ count: 0 }, []];
  }

  update(
    message: CounterMessage,
    model: CounterModel
  ): [CounterModel, Command<CounterMessage>] {
    switch (message) {
      case "Increase":
        return [{ count: model.count + 1 }, []];
      case "Decrease":
        return [{ count: model.count - 1 }, []];
    }
  }

  view(model: CounterModel, dispatch: Dispatch<CounterMessage>): HTMLElement {
    const wrapper = document.createElement("article");

    const span = document.createElement("span");
    span.innerText = model.count.toString();
    wrapper.appendChild(span);

    const increaseButton = document.createElement("button");
    increaseButton.innerText = "Increase";
    increaseButton.addEventListener("click", () => dispatch("Increase"));
    wrapper.appendChild(increaseButton);

    const decreaseButton = document.createElement("button");
    decreaseButton.innerText = "Decrease";
    decreaseButton.addEventListener("click", () => dispatch("Decrease"));
    wrapper.appendChild(decreaseButton);

    return wrapper;
  }

  // ⏬ Component lifecycle callbacks ⏬
  connectedCallback() {
    console.debug("Connected");
    // Run initialization and view?
    const shadowRoot = this.attachShadow({ mode: "open" });
    let [model] = this.initialize();
    const dispatch: Dispatch<CounterMessage> = (message: CounterMessage) => {
      const [newModel] = this.update(message, model);
      console.debug("Dispatch", { message, newModel, oldModel: model });
      model = newModel;
      const newView = this.view(model, dispatch);
      shadowRoot.replaceChildren(newView);
    };

    const view = this.view(model, dispatch);
    shadowRoot.appendChild(view);
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

customElements.define("elmish-counter", ElmishCounter);
