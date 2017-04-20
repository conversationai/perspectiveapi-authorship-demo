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
import * as cmd_interpreter from './cmd_interpreter';
import * as run from './run';

// Top level command.
let top_level_cmd = new cmd_interpreter.Family(
  'Description of top level command.');

// Allows one to call `run.sh foo`
let cmd_foo = top_level_cmd.addSubFamily('foo', 'foo description');

const FOO_OPTIONS : cmd_interpreter.OptionsSpec = {
  'bar': {
    description: 'description of the --bar=... option.',
    can_have_value: true,
  },
  'peh': {
    description: 'description of the --peh option.',
    can_have_value: false,
  }
};

cmd_foo.addCommand('echo', 'foo echo description',
    FOO_OPTIONS, (options:cmd_interpreter.Options) => {
  let peh_str = ('peh' in options) ? 'peh!' : '';
  let bar_str = ('bar' in options) ? options['bar'] : '';
  run.sync(`echo '${peh_str}:${bar_str}'`);
});

cmd_foo.addCommand('echoz', 'foo echoz description', {}, () => {
  run.sync(`echo 'zzz'`);
});

// Interpret the arguments provided on the command line (except for the
// two `ts-node` and  `example.ts`
let args = process.argv.slice(0);
args.splice(0, 2);
top_level_cmd.interpret(args);
