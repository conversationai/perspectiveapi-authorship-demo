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
var path = require('path');
// Note: __dirname is the path to this file.
// the root function makes paths provided relative the directory containing
// the wepapp.
var _root = path.resolve(__dirname, '../..');
// console.log("__dirname:" + __dirname);
function root() {
  args = Array.prototype.slice.call(arguments, 0);
  long_path = path.join.apply(path, [_root].concat(args));
  // console.log('long_path:' + long_path);
  return long_path;
}
exports.root = root;
