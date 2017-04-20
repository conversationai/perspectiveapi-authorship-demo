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
import * as fs from 'fs';
import * as log from './log';
import * as path from 'path';

// Common function that do things you might otherwise do from a shell.

export function isDir(d: string): boolean {
  try {
    const stats = fs.statSync(d);
    return stats.isDirectory();
  } catch (e) { return false; }
}

export function chDir(d: string): void {
  if (!isDir(d)) {
    throw Error('No such dir: ' + d);
  }
  log.cmd('cd ' + d);
  process.chdir(d);
}

export function ensureDir(d: string): void {
  let parent = path.dirname(d)
  if (parent && parent != "." && parent != "/") {
    ensureDir(parent);
  }
  if (!isDir(d)) { fs.mkdir(d); }
}

export function getSymLinkTarget(symLinkFilePath: string): string|null {
  try {
    const symLinkTarget = fs.readlinkSync(symLinkFilePath);
    return symLinkTarget;
  } catch (e) { return null; }
}

export function writeToFile(fileName: string, textToWrite: string): void {
  fs.writeFileSync(fileName, textToWrite);
}

export function ensureSymLink(symLinkToThisTarget: string,
  newLinkAtPath: string): void {
  if (fs.existsSync(newLinkAtPath)) {
    const currentSymLinkTarget = getSymLinkTarget(newLinkAtPath)
    if (currentSymLinkTarget === null) {
      throw Error('A non-symlink file exists at: ' + newLinkAtPath);
    } else if (currentSymLinkTarget !== symLinkToThisTarget) {
      fs.unlinkSync(newLinkAtPath);
      fs.symlinkSync(symLinkToThisTarget, newLinkAtPath);
    }
  } else {
    fs.symlinkSync(symLinkToThisTarget, newLinkAtPath);
  }
}

// Create a mirror, recursively, of the sourcePath in the targetPath, where
// each file in source path is sym-linked to a identical sub path in targetPath.
export function mirrorDirWithSymLinks(sourcePath: string, targetPath: string) {
  const filenames = fs.readdirSync(sourcePath);
  for (const filename of filenames) {
    // log.info('considering: ' + filename);
    const source = path.join(sourcePath, filename);
    const target = path.join(targetPath, filename);
    // Mirror Directories into the build dir
    if (isDir(source)) {
      ensureDir(target);
      mirrorDirWithSymLinks(source, target);
    } else {
      // SymLink files to files source.
      ensureSymLink(path.relative(targetPath, source), target)
    }
  }
}
