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
var path_helper = require('./path_helper');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  devtool: 'inline-source-map',

  resolve: {
    extensions: ['', '.ts', '.js']
  },

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loaders: ['awesome-typescript-loader', 'angular2-template-loader']
      },
      {
        test: /\.html$/,
        loader: 'html'

      },
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
        loader: 'null'
      },
      {
        test: /\.css$/,
        exclude: path_helper.root('webapp', 'src'),
        loader: 'null'
      },
      {
        test: /\.css$/,
        exclude: path_helper.root('webapp', 'src'),
        loader: 'raw'
      },
      {
        // Use to-string-loader because styles in @Component template requires a
        // list of strings for css.
        // See https://github.com/webpack/style-loader/issues/123#issuecomment-230079894
        test: /\.css$/,
        include: path_helper.root('webapp', 'src'),
        loaders: [
            'to-string',
            'css',
            'sass-loader',
        ]
      },
    ]
  }
}
