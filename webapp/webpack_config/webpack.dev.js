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
var webpackMerge = require('webpack-merge');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var commonConfig = require('./webpack.common.js');
var path_helper = require('./path_helper');

module.exports = webpackMerge(commonConfig, {
  devtool: 'source-map',

  // output: {
  //   path: helpers.root('build/dist'),
  //   publicPath: 'http://localhost:8080/',
  //   filename: '[name].js',
  //   chunkFilename: '[id].chunk.js'
  // },

  output: {
    // The path to output built files to
    path: path_helper.root('build', 'webapp', 'dev'),
    // The path these files expect to be at on the web-server
    publicPath: '/',
    // How files are named
    filename: '[name].js',
    chunkFilename: '[id].chunk.js'
  },

  htmlLoader: {
    minimize: false // workaround for ng2
  },

  // plugins: [
  //   new ExtractTextPlugin('[name].css')
  // ],
});
