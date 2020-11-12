const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    library: 'bootWorker',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  plugins: [
    new CleanWebpackPlugin(),
  ],
  devtool: 'source-map',
  mode: 'development',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /worker\.js$/,
        use: { loader: 'worker-loader' },
      },
      {
        test: /worker\.js$/,
        use: { loader: 'url-loader' },
      },
    ],
  }
};