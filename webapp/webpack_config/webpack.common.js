/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path_helper = require('./path_helper');
var FaviconsWebpackPlugin = require('favicons-webpack-plugin')

module.exports = {
  // TODO: Investigate: This requires any component using our app to import all
  // 3 of these scripts. Would it be better to merge them?
  entry: {
    'polyfills': path_helper.root('webapp', 'src', 'polyfills.ts'),
    'vendor': path_helper.root('webapp', 'src', 'vendor.ts'),
    'main': path_helper.root('webapp', 'src', 'main.ts'),
  },

  resolve: {
    extensions: ['', '.js', '.ts']
  },

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'ts'
      },
      {
        test: /\.html$/,
        loader: 'html'
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot)$/,
        loader: 'file?name=assets/[name].[hash].[ext]'
      },
      {
        // Hacky workaround for lots of edge cases, including templates and
        // delayed load.
        // Use the ExtractTextPlugin so that the styles are added to the html
        // at runtime. Otherwise there is a delayed CSS rendering.
        // Use to-string-loader because styles in @Component template requires a
        // list of strings for css.
        // See https://github.com/webpack/style-loader/issues/123#issuecomment-230079894
        test: /\.css$/,
        include: path_helper.root('webapp', 'src'),
        loaders: [
            ExtractTextPlugin.extract('style', 'css-loader'),
            'to-string',
            'css',
            'sass-loader',
        ]
      },
    ]
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: ['main', 'vendor', 'polyfills']
    }),

    new HtmlWebpackPlugin({
      template: path_helper.root('webapp', 'src','index.html')
    }),
    new ExtractTextPlugin('[name].css'),

    new FaviconsWebpackPlugin(path_helper.root('webapp', 'src','favicon.png'))
  ]
};
