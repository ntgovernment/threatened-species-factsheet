const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "threatened-species-factsheet.js",
    library: {
      name: "ThreatenedSpeciesFactsheet",
      type: "umd",
      export: "default",
    },
    globalObject: "this",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              api: "modern",
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "threatened-species-factsheet.css",
    }),
  ],
  optimization: {
    minimize: true,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "./"),
    },
    compress: true,
    port: 8080,
    open: true,
    hot: true,
    liveReload: true,
  },
};
