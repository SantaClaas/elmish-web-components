const postcssJitProps = require("postcss-jit-props");
const OpenProps = require("open-props");

module.exports = {
  plugins: [
    postcssJitProps({
      files: [require("open-props/open-props.min.css")],
    }),
  ],
};
