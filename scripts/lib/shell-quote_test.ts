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
// shell-quote_test.d.ts
import { quote, parse } from 'shell-quote';

describe('shell_quote', function() {
  describe('parse', function() {
    it('env var', function() {
      expect(parse('beep --boop="$PWD"', { PWD: '/home/robot' }))
      .toEqual(['beep', '--boop=/home/robot']);

      expect(parse('beep --boop="$PWD"', { PWD: '/home/robot' },
                                         { escape: '^' }))
      .toEqual(['beep', '--boop=/home/robot']);
    });
    it('pipes', function() {
      expect(parse('beep --boop="$PWD"', { PWD: '/home/robot' }))
      .toEqual(['beep', '--boop=/home/robot']);

      expect(parse('beep || boop > /byte'))
      .toEqual([ 'beep', { op: '||' }, 'boop', { op: '>' }, '/byte' ]);
    });
    // Comment parsing misses the first space.
    xit('comment', function() {
      expect(parse('beep > boop # > kaboom'))
      .toEqual(['beep', { op: '>' }, 'boop', { comment: ' > kaboom'}]);
    });
    // https://github.com/substack/node-shell-quote/issues/19
    xit('quoted things', function() {
      expect(parse('a "b c" \\$def \'it\\\'s great\''))
      .toEqual(['a', 'b c', '$def', 'it\'s great']);
    });
  });
  describe('quote', function() {
    it('simple', function() {
      expect(quote([ 'a', 'b c d', '$f', '"g"' ]))
      .toBe('a \'b c d\' \\$f \'"g"\'');
    });
  });
});
