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
import * as child_process from 'child_process';
import * as log from './log';
import * as shell_quote from 'shell-quote';

// Global variable to ensure that stdin from the outer process is only being
// used by one subprocess at a time.
let gStdInBeingUsed = false;

function logEnv(env?:Environment) : void {
  if(env) {
    for(let k of Object.keys(env)) {
      log.info(`${k}="${env[k]}"`);
    }
  }
}

function start_using_stdin() : void {
  if (gStdInBeingUsed) {
    log.error('Cannot run multiple things that (may) read stdin at the ' +
      'same time, its too confusing.');
    process.exit(1);
    throw Error();
  }
  gStdInBeingUsed = true;
}

function stop_using_stdin() : void {
  gStdInBeingUsed = false;
}

export type Environment = { [varname:string] : string };

export interface Options {
  // default is {} and used env inherits from parent process env.
  env ?: Environment;
  ignore_stdin ?: boolean;  // default is false;
};

export interface AsyncRunResult {
  stdout: string;
  stderr: string;
  status: number;
  error_message?: string;
}

// Simple commands are the subset of commands from `shell_quote.parse` that
// don't involve any fancy piping of data.
export interface SimpleCommand {
  // Command being executed.
  exec: string;
  // Arguments given to the command.
  args: string[];
}

export function isStringArgument(a:shell_quote.Argument) : a is string {
  return (typeof a === 'string');
}

export function parseSimpleCommand(commandString: string, env?:Environment)
    : SimpleCommand {
  const parsed_args = shell_quote.parse(commandString, env);

  let execCommand : shell_quote.Argument = parsed_args[0];
  if (parsed_args.length === 0 || !isStringArgument(execCommand)) {
    throw Error('not a valid command');
  }

  let command : SimpleCommand = {
    exec: execCommand,
    args: []
  };

  for (let i = 1; i < parsed_args.length; i++) {
    let arg: shell_quote.Argument = parsed_args[i];
    if (!isStringArgument(arg)) {
      console.error('Invalid argument: ' + JSON.stringify(arg));
      throw Error('not a valid argument: ' + JSON.stringify(arg));
    }
    command.args.push(arg);
  }

  return command;
}

export function sync(commandString: string, options ?:Options)
    : child_process.SpawnSyncReturns<Buffer> {
  //// Treat string a bit like a shell command string. Any space characters or a
  //// backalsh (`\`) followed by a new line are used to separate arguments.
  //
  // let cmdAndArgs = commandString.split(/\s+/)
  //     .filter((s:string) => { return s !== ''; });
  let env = options ? options.env : undefined;
  let cmdAndArgs = parseSimpleCommand(commandString, env);
  return syncArgs(cmdAndArgs.exec, cmdAndArgs.args, options);
}

function syncArgs(command: string, args: string[], options ?:Options)
    : child_process.SpawnSyncReturns<Buffer> {
  log.comment(`# ${command} ${JSON.stringify(args)}`);
  log.cmd(command + ' ' + args.join(' '));
  let env = options ? options.env : undefined;
  logEnv(env);
  let using_stdin = (!options || !options.ignore_stdin);
  if (using_stdin) {
    start_using_stdin();
  }
  const process_options = {
    stdio: [ using_stdin ? process.stdin : 'pipe',
             process.stdout, process.stderr],
    env: Object.assign({}, process.env, env),
    // stdio: [process.stdin],
    detached: false  // false = die if the parent dies.
  };

  const result : child_process.SpawnSyncReturns<Buffer> =
      child_process.spawnSync(command, args, process_options);

  if (result.status !== 0) {
    log.error(`${command}: resulted in error code: ${result.status}`);
    process.exit(result.status);
    throw Error();
  }
  stop_using_stdin();
  return result;
}

export async function async(commandString: string, options ?:Options)
    : Promise<AsyncRunResult> {
  let env = options ? options.env : undefined;
  let cmdAndArgs = parseSimpleCommand(commandString, env);

  return asyncArgs(cmdAndArgs.exec, cmdAndArgs.args, options);
}

export async function asyncArgs(
    command: string, args: string[], options ?:Options)
    : Promise<AsyncRunResult> {
  log.comment(`# ${command} ${JSON.stringify(args)}`);
  log.cmd(command + ' ' + args.join(' '));

  let env = options ? options.env : undefined;
  logEnv(env);

  let using_stdin = (!options || !options.ignore_stdin);
  if (using_stdin) {
    start_using_stdin();
  }
  const subprocess_options = {
    detached: false,  // false = die if the parent dies.
    stdio: [ using_stdin ? process.stdin : 'pipe',
             'pipe', 'pipe'],
    // Merge the process environment with the env variable.
    env: Object.assign({}, process.env, env),
  };

  const sub_process = child_process.spawn(command, args, subprocess_options);
  let result : AsyncRunResult = {
    stderr: '',
    stdout: '',
    status: 0,
  }

  sub_process.stderr.on('data', (buf:ArrayBuffer) => {
    result.stderr += buf;
    log.error(`${buf}`);
  });

  sub_process.stdout.on('data', (buf:ArrayBuffer) => {
    result.stdout += buf;
    log.info(`${buf}`);
  });

  let return_promise : Promise<AsyncRunResult> = new Promise((F,R) => {
    sub_process.on('exit', (status:number) => {
      result.status = status;
      stop_using_stdin();

      if (status !== 0) {
        log.error(`${command}: resulted in error code: ${status}`);
        process.exit(status);
        R(Error('non-zero error'));
      }

      F(result);
    });
  });

  return return_promise;
}

