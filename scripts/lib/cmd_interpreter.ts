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
import * as log from './log';

const CMD_NAME_REGEXP = new RegExp(/^[^\-]\w+$/);
const OPTION_REGEXP = new RegExp(/^\-\-([^\=\s]+)(\=(.+))?$/);

export interface OptionSpec {
  description: string;
  can_have_value: boolean;
}
export type OptionsSpec = { [option_name:string] : OptionSpec };
export type Options = { [option_name:string] : string|null };

export class Command {
  constructor(
      public description : string,
      private options : OptionsSpec,
      private fn : (options: Options) => void) {
    options['help'] = { description: 'Print help and usage.',
                        can_have_value: false};
  }

  private interpretOption(arg:string, optionsSoFar:Options) : boolean {
    let optionMatch = arg.match(OPTION_REGEXP);
    if (!optionMatch) {
      return false;
    }

    let option_name = optionMatch[1];
    let option_val : string = optionMatch[3] || '';

    if (option_name in this.options) {
      if (!this.options[option_name].can_have_value && option_val) {
        log.error(`Option: ${option_name} may not have a value ` +
            `(had: ${option_val})`);
        throw new Error('Option with not allowed value');
      }
      if (!option_val) { option_val = ''; }
      optionsSoFar[option_name] = option_val;
      return true;
    } else {
      log.error(`Unknown option: ${option_name}`);
      throw new Error('Unknown option');
    }
  }

  public interpret(args:string[]) : void {
    let parsedOptions : { [option_name:string] : string|null } = {};
    while (args.length !== 0 && this.interpretOption(args[0], parsedOptions)) {
      args.splice(0,1);
    }
    // log.info(`parsedOptions: ${JSON.stringify(parsedOptions)}`)
    if ('help' in parsedOptions) {
      this.print_usage();
    } else {
      this.fn(parsedOptions);
    }
  }

  public run(options: Options) { this.fn(options); }

  public print_usage() {
    log.info(this.description);
    log.info('Usage:');

    for (let opt_name in this.options) {
      log.info(`  --${opt_name} : ${this.options[opt_name].description}`);
    }
  }

}


export class Family {
  private subfamilies: { [subcmd:string] : Family }
  private cmds: { [subcmd:string] : Command }

  // The constructor should only be called by the
  constructor(public description : string) {
    this.subfamilies = {};
    this.cmds = {};
  }

  private assertCommandNameIsFresh(name: string) : void {
    if (name in this.cmds || name in this.subfamilies) {
      log.error(
          `The command ${name} is already defined.`);
      throw new Error('Dup command.');
    }
  }

  public addSubFamily(name: string, description:string) : Family {
    this.assertCommandNameIsFresh(name);
    let subFamily = new Family(description);
    this.subfamilies[name] = subFamily;
    return subFamily;
  }

  public addCommand(name: string, description:string,
      options: OptionsSpec,
      cmdfn: (options:Options) => void) : Command {
    this.assertCommandNameIsFresh(name);
    let cmd = new Command(description, options, cmdfn);
    this.cmds[name] = cmd;
    return cmd;
  }

  public interpret(args:string[]) : void {
    if (args.length === 0) {
      log.error('Missing command.\n');
      this.print_usage();
      return;
    }
    let cmd = args[0];
    if (cmd === '--help' || cmd === 'help') {
      this.print_usage();
      process.exit(0);
    }

    let cmdMatch = cmd.match(CMD_NAME_REGEXP);
    if (cmdMatch) {
      if(cmd in this.cmds) {
        args.splice(0,1);
        this.cmds[cmd].interpret(args);
      } else if (cmd in this.subfamilies) {
        args.splice(0,1);
        this.subfamilies[cmd].interpret(args);
      } else {
        log.error(`No such command: ${cmd}.`)
        this.print_usage();
        process.exit(1);
        // throw new Error('No such command.');
      }
    } else {
      log.error(`Invalid sub-command: ${cmd}`);
      this.print_usage();
      process.exit(1);
      // throw new Error('Invalid sub-command.');
    }
  }

  private getDescription(name:string) : string {
    if (name in this.cmds) {
      return this.cmds[name].description;
    } else if (name in this.subfamilies) {
      return this.subfamilies[name].description;
    } else {
      log.error(`No such name: ${name}.`)
      throw new Error('No such name.');
    }
  }

  public print_usage() {
    log.info(this.description);
    log.info(`Usage: `);

    let names : string[] =
      Object.keys(this.cmds).concat(Object.keys(this.subfamilies)).sort();
    for (let name of names) {
      let description = this.getDescription(name);
      log.info(`  * ${name} : ${description}`);
    }
  }
};
