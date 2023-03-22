export function setupCounter(element: HTMLButtonElement) {
  let counter = 0;
  const setCounter = (count: number) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;
  };
  element.addEventListener("click", () => setCounter(counter + 1));
  setCounter(0);
}

type Dispatch<TMessage> = (message: TMessage) => void;
abstract class ElmishComponent<TModel, TMessage> extends HTMLElement {
  abstract update(model: TModel, message: TMessage): TModel;

  abstract view(model: TModel, dispatch: Dispatch<TMessage>): string;
}
