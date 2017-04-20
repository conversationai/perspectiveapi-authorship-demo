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

describe('cmd_interpreter', function() {
  it('make family, and add subfamily and command', function() {
    // Top level command.
    let cmd = new cmd_interpreter.Family(
      'Description of top level command.');

    let cmd_foo = cmd.addSubFamily('foo', 'foo description');

    let a1 = 0;
    let a1fn = () => { a1 += 1 };
    cmd_foo.addCommand('a1', 'foo a1 description', {}, a1fn);

    let a2 = '';
    let a2fn = (options:cmd_interpreter.Options) => {
      a2 += options['str'];
    };
    cmd_foo.addCommand(
      'a2', 'foo a2 description',
      {'str': { description: 'string to append to a2',
                can_have_value: true }},
      a2fn);

    expect(a1).toBe(0);
    expect(a2).toBe('');
    cmd.interpret(['foo', 'a1']);
    expect(a1).toBe(1);
    cmd.interpret(['foo', 'a1']);
    expect(a1).toBe(2);

    expect(a2).toBe('');
    cmd.interpret(['foo', 'a2', '--str=pants']);
    expect(a2).toBe('pants');
    cmd.interpret(['foo', 'a2', '--str=2']);
    expect(a2).toBe('pants2');

    expect(() => { cmd.interpret(['foo', 'a2', '--no_such_option']); })
    .toThrow(new Error("Unknown option"));
  });
});
