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
 * Find source where I have the idea from with defining the grid with letters
 */

function createSlots(distinctTokens: Set<string>) {
  return Array.from(distinctTokens).map((token) => {
    const tokenSlot = document.createElement("slot") as HTMLSlotElement;
    tokenSlot.name = token;

    return tokenSlot;
  });
}

const css = `
  div {
    display: grid;
    grid-template: "a b" "c d";
    background-color: green;
  }

  ::slotted(*) {
    background-color: red;
  }
`;
export default class DimGrid extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });

    const templateAttribute = this.getAttribute("template");
    if (templateAttribute) {
      const templateString = templateAttribute;
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

      // Calculate ratio
      // Get distinct tokens in first row
      for (const row of gridLayout) {
        const widthByToken = new Map<string, number>();

        let previousToken = row[0];
        let tokenWidth = 1;
        for (const currentToken of row.slice(1)) {
          if (previousToken === currentToken) {
            // Case continuation of token
            tokenWidth++;
            continue;
          }

          // Case switch to new token
          // Save width and continue to next token
          widthByToken.set(previousToken, tokenWidth);
          // Reset to one
          tokenWidth = 1;
          // Switch
          previousToken = currentToken;
        }

        // Add final token
        widthByToken.set(previousToken, tokenWidth);

        console.debug(row, widthByToken);
      }

      // Add styles. Is there a better way?
      const style = document.createElement("style");

      style.innerHTML = css;
      shadowRoot.appendChild(style);

      const wrapper = document.createElement("div");

      shadowRoot.appendChild(wrapper);

      // Add token slots
      const tokenSlots = createSlots(distinctTokens);

      wrapper.append(...tokenSlots);
    }
  }
}

customElements.define("dim-grid", DimGrid);
