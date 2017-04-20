# The development scripts

This directory contains typescript based scripts to provide an interactive tool
to help remember the various commands to build, serve, and deploy the app.

To see the options available, run:

```bash
./scripts/run.sh --help
```

The `lib/` subdirectory contains generic tools for writing utilities as
Typescript where you might previously have used bash scripts or grunt.

## Goals

 * Understandable: Easy to understand what is happening from looking at the
   source code.
 * Transparent: running individual steps by hand is easy from the command line.
 * Robust: scripts should be type-checked; more robust in the face of changes.
 * Flexible: easy to extend to new projects and modify when build processes
   change.

## Why not bash?

The great thing about bash scripts is that they are what you type into the
termnal (Transparency success). But they are not typed (Robustness fail),
and as soon as they get larger, parameterized by extra options have lots of
dependencies you end up being a disaster to maintain and understand (Flexiblity
and Understandability fail).

## How does it work?

The shell script `scripts/run.sh` invokes
[`ts-node`](https://www.npmjs.com/package/ts-node), from the project root
directory, to evaluate the `scripts/run.ts` file.

The `scripts/run.ts` file is a (relatively) readable Typescript alternative to a
shell script. To illustrate how it works, consider the following alternative
[example](lib/example.ts) of a `run.ts` file:

```javascript
import * as cmd_interpreter from './cmd_interpreter';
import * as shell from './shell';

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
  shell.run(`echo '${peh_str}:${bar_str}'`);
});

cmd_foo.addCommand('echoz', 'foo echoz description', {}, () => {
  shell.run(`echo 'zzz'`);
});

// Interpret the arguments provided on the command line (except for the
// two `ts-node` and  `example.ts`
let args = process.argv.slice(0);
args.splice(0, 2);
top_level_cmd.interpret(args);
```

This can then be invoked as follows. To see a list of available commands:

```bash
ts-node -P scripts scripts/lib/example.ts --help
```

Will print:

```
 Description of top level command.
 Usage:
   * foo : foo description
```

and:

```bash
ts-node -P scripts scripts/lib/example.ts foo --help
```

Will print:


```
 foo description
 Usage:
   * echo : foo echo description
   * echoz : foo echoz description
```

And running the command:

```
ts-node -P scripts scripts/lib/example.ts foo --bar=bugs
```

Will print:

```
 echo ':bugs'
':bugs'
```

Note that the quotes are included as part of the argument (differently
to a shell script)
