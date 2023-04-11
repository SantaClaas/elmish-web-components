const postcssJitProps = require("postcss-jit-props");
const OpenProps = require("open-props");
const postcssCustomMedia = require("postcss-custom-media");

module.exports = {
  // Only variables used in open props
  plugins: [postcssJitProps(OpenProps), postcssCustomMedia()],
};
