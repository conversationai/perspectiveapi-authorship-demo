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
// Color   FG  BG
// -------------
// Black   30  40
// Red     31  41
// Green   32  42
// Yellow  33  43
// Blue    34  44
// Magenta 35  45
// Cyan    36  46
// White   37  47

export function error(...args:Object[]) {
  console.error(`\x1b[31m${args}\x1b[0m`);
};
export function warn(...args:Object[]) {
  console.warn(`\x1b[33m${args}\x1b[0m`);
};
export function info(...args:Object[]) {
  console.log(`\x1b[35m${args}\x1b[0m`);
};
export function cmd(...args:Object[]) {
  console.log(`\x1b[32m${args}\x1b[0m`);
};
export function comment(...args:Object[]) {
  console.log(`\x1b[34m${args}\x1b[0m`);
};
