import { TemplateResult, html } from "lit-html";
import { ViewElement } from "../../../src/elmishComponent";
import { css } from "../styling";

class OutlinedInput extends ViewElement {
  static styles = css`
    :host {
      display: block;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif,
        "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
        "Noto Color Emoji";
    }
    * {
      box-sizing: border-box;
      border-width: 0;
      border-style: solid;
      border-color: var(--md-sys-color-outline);
    }

    /* normalize */
    input {
      font-family: inherit;
      font-size: 100%;
      font-weight: inherit;
      line-height: inherit;
      color: inherit;
      margin: 0;
      padding: 0;
    }
    .group {
      /* relative */
      position: relative;
      /* border-md */
      border-radius: 0.375rem;
    }

    .group input {
      /* transistion-all */
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;

      /* outline-none */
      outline: 2px solid transparent;
      outline-offset: 2px;

      /* leading-none */
      line-height: 1;

      /* py-3 */
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;

      /* px-4 */
      padding-left: 1rem;
      padding-right: 1rem;

      /* rounded-md */
      border-radius: 0.375rem;

      /* touch-manipulation */
      touch-action: manipulation;

      /* w-full */
      width: 100%;
    }

    .group .fillers {
      /* touch-manipulation */
      touch-action: manipulation;

      /* origin-top-left */
      transform-origin: top left;

      /* w-full */
      width: 100%;

      /* h-full */
      height: 100%;

      /* flex */
      display: flex;

      /* top-0 */
      top: 0;

      /* left-0 */
      left: 0;

      /* absolute */
      position: absolute;

      /* pointer-events-none */
      pointer-events: none;
    }

    .group .fillers .filler-start {
      border-style: solid;
      /* border-slate-400 */
      border-color: var(--md-sys-color-outline);

      /* border-l */
      border-left-width: 1px;

      /* border-y */
      border-top-width: 1px;
      border-bottom-width: 1px;

      /* rounded-l-md */
      border-top-left-radius: 0.375rem;
      border-bottom-left-radius: 0.375rem;

      /* w-4 */
      width: 1rem;
    }

    .group .fillers .filler-middle {
      /* px-0.5 */
      padding-left: 0.125rem;
      padding-right: 0.125rem;

      /* border-slate-400 */
      border-color: var(--md-sys-color-outline);

      /* border-y */
      border-top-width: 1px;
      border-bottom-width: 1px;
    }

    .group .fillers .filler-middle label {
      display: block;
      /* text-slate-400 */
      color: #94a3b8;
      /* whitespace-nowrap */
      white-space: nowrap;

      /* transition-all */
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;

      /* translate-y-1/3 */
      transform: translateY(33.33333333333333%);

      /* Needs to be set here to also apply to div and label */
      line-height: 1.5;
    }

    .group .fillers .filler-end {
      /* border-slate-400 */
      border-color: var(--md-sys-color-outline);
      /* border-r */
      border-right-width: 1px;

      /* border-y */
      border-top-width: 1px;
      border-bottom-width: 1px;

      /* rounded-r-md */
      border-top-right-radius: 0.375rem;
      border-bottom-right-radius: 0.375rem;

      /* w-full */
      width: 100%;
    }

    /* Only remove border top when label moves up e.g focus, not-empty, placeholder shown */
    .group:focus-within .fillers .filler-middle {
      /* border-t-transparent */
      border-top-color: transparent;
    }

    /* Only move label up when label moves up e.g focus, not-empty, placeholder shown */
    .group:focus-within .fillers .filler-middle label {
      /* -translate-y-3.5 */
      transform: translateY(-0.5rem);
    }

    /* Only move label up when label moves up e.g focus, not-empty, placeholder shown */
    .group:focus-within .fillers .filler-middle label {
      /* text-xs */
      font-size: 0.75rem;
      line-height: 1rem;
    }
  `;

  // TODO check if I can remove outer two divs
  view(): TemplateResult {
    return html`<div>
      <div class="group">
        <input id="input" />
        <div class="fillers">
          <!-- Filler start -->
          <div class="filler-start"></div>
          <!-- Filler middle -->
          <div class="filler-middle">
            <label for="input">Label text</label>
          </div>
          <!-- Filler end -->
          <div class="filler-end"></div>
        </div>
      </div>
    </div>`;
  }
}

customElements.define("dim-outlined-input", OutlinedInput);
