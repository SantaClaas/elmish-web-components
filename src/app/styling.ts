// This is inspired by lit css styling
// I left out a lot of optimizations like the lazy style sheet creation, caching and ensuring safe CSS
export async function css(
  strings: TemplateStringsArray
): Promise<CSSStyleSheet> {
  const cssString = strings.join();
  const styleSheet = new CSSStyleSheet();
  // We return a promise to not block while replacement is running
  // This is important because styles are usually stored in static fields that will be initialized when encountered
  // This is based on assumptions and has not been performance tested. Lit does it with lazily initiating style sheets
  const otherSheet = await styleSheet.replace(cssString);
  return otherSheet;
}
