/**
 * Idea for a web component named "<dim-grid>" where contents are displayed in a CSS grid layout
 * The grid layout is controlled by a string e.g.
 * aabbbb
 * aabbbb
 * cccddd
 * cccddd
 * Each letter is called a "token". I can be any character e.g. this would be valid too
 * ||!!!!
 * ||!!!!
 * $$$---
 * $$$---
 * We calculate the ratio of each element by counting the tokens width and height starting on the top left
 * The element will create slots based on how many different tokens there are. The slots name will be their token.
 * It is an excerise in building web components.
 */

function createSlots(distinctTokens: Set<string>) {
  return Array.from(distinctTokens).map((token) => {
    const tokenSlot = document.createElement("slot") as HTMLSlotElement;
    tokenSlot.name = token;

    return tokenSlot;
  });
}

export default class DimGrid extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "closed" });
    const textElement = document.createElement("span");

    const templateAttribute = this.attributes.getNamedItem("template");
    if (templateAttribute) {
      const templateString = templateAttribute.value;
      const gridLayout = templateString
        // Trim so we don't end up with empty lines
        .trim()
        .split(/\r\n|\r|\n/)
        // Trim each line again so we can relyably access each index
        .map((line) => line.trim());

      // Tokens are characters
      const distinctTokens = new Set(
        gridLayout.map((string) => [...string]).flat()
      );

      const tokenSlots = createSlots(distinctTokens);
      shadowRoot.append(...tokenSlots);

      console.log("Distinct tokens", distinctTokens);
      console.log(templateString);
      textElement.textContent = templateString;
    }

    shadowRoot.appendChild(textElement);
  }
}

customElements.define("dim-grid", DimGrid);
