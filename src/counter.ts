// A typical counter component implementation to try implementing elmish

export default class ElmishCounter extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    shadowRoot.innerHTML = "<span> hello </span>";
  }

  connectedCallback() {
    console.debug("Connected");
    // Run initialization and view?
  }

  disconnectedCallback() {
    console.debug("Disconected");
    // Run unsubscribe?
  }

  adoptedCallback() {
    console.debug("Adopted");
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string
  ) {
    console.debug("Attribute changed", { name, oldValue, newValue });
  }

  static get observedAttributes() {
    console.debug("Get observed attributes");
    return ["value"];
  }
}

customElements.define("elmish-counter", ElmishCounter);
