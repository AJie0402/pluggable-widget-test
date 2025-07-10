import { normalize } from 'path';
import { getBabelInputPlugin } from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";
// import postcssLess from "postcss-less"; // 可視情況註解

function replacePlugin(config, name, plugin) {
  if (typeof name === 'string') {
    const index = config.plugins.findIndex(p => p.name === name);
    if (index !== -1) {
      config.plugins[index] = plugin;
    } else {
      console.warn(`Plugin named "${name}" not found.`);
    }
  } else if (typeof name === 'number') {
    if (config.plugins[name]) {
      config.plugins[name] = plugin;
    } else {
      console.warn(`Plugin at index ${name} not found.`);
    }
  }
}

export default args => {
  const production = Boolean(args.configProduction);
  const result = args.configDefaultConfig;
  const [jsConfig, mJsConfig] = result;

  [jsConfig, mJsConfig].forEach(config => {
    const newBabelPlugin = getBabelInputPlugin({
      sourceMaps: !production,
      babelrc: false,
      babelHelpers: "bundled",
      plugins: ["@babel/plugin-proposal-class-properties"],
      overrides: [
        {
          test: /node_modules/,
          plugins: ["@babel/plugin-transform-flow-strip-types", "@babel/plugin-transform-react-jsx"]
        },
        {
          exclude: /node_modules/,
          plugins: [
            ["@babel/plugin-transform-react-jsx", {
              runtime: "automatic"
            }]
          ]
        }
      ]
    });

    replacePlugin(config, 9, newBabelPlugin);

    config.plugins.unshift(
      postcss({
        extensions: [".css", ".less"],
        use: [
          ["less", { javascriptEnabled: true }]
        ],
        // parser: postcssLess, // 如遇錯誤可嘗試註解此行
        exclude: 'node_modules/**', // 避免編譯第三方 less
        sourceMap: !production,
        extract: false, // 可改成 true 或路徑，視需求決定
      })
    );

    const onwarn = config.onwarn || (() => {});
    config.onwarn = warning => {
      const ignoredWarnings = [
        {
          ignoredCode: 'CIRCULAR_DEPENDENCY',
          ignoredPath: 'node_modules/@projectstorm/geometry/dist/Polygon.js',
        },
        {
          ignoredCode: 'CIRCULAR_DEPENDENCY',
          ignoredPath: 'node_modules/@projectstorm/react-diagrams-routing/dist/link/PathFindingLinkFactory.js',
        },
        {
          ignoredCode: 'CIRCULAR_DEPENDENCY',
          ignoredPath: 'node_modules/@projectstorm/react-diagrams-routing/dist/link/RightAngleLinkFactory.js',
        },
      ];

      if (!ignoredWarnings.some(({ ignoredCode, ignoredPath }) => (
        warning.code === ignoredCode &&
        normalize(warning.importer).includes(normalize(ignoredPath))
      ))) {
        onwarn(warning);
      }
    };
  });

  return result;
};
