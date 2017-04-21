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
import * as path from 'path';
import * as run from './lib/run';
import * as fs from 'fs';
import * as fsys from './lib/fsys';
import * as cmd_interpreter from './lib/cmd_interpreter';
import * as log from './lib/log';

// Make all operations act as if they are from the project root dir.
const BASE_DIR = path.dirname(__dirname);
fsys.chDir(BASE_DIR);

log.info(`# Running as: ${process.getuid()} from: ${BASE_DIR}`);

let config = JSON.parse(fs.readFileSync(
  path.join(BASE_DIR, 'build/config/deploy_config.json'), 'utf8'));
if (!config.googleCloudProjectId || config.googleCloudProjectId === '') {
  log.error(`Please set googleCloudProjectId in the 'build/deploy_config.json' file.`);
  process.exit(1);
}

// Top level command.
let cmd = new cmd_interpreter.Family(
  'This is the development tools script.');

const WEBAPP_DIR = path.join(BASE_DIR, 'webapp');
const TOOLS_DIR = path.join(BASE_DIR, 'scripts');
const BUILD_DIR = path.join(BASE_DIR, 'build');

// The local docker image name has to be restricted/modified to be a valid
// docker image name.
const LOCAL_DOCKER_IMAGE_NAME =
    config.googleCloudProjectId.replace(/(\.|\:)/g, '_');

// For uploading docker images, there is a special name translation for names
// that contain ":" which indicates it is a cloud organization project.
const GLCOUD_DOCKER_IMAGE_NAME =
    config.googleCloudProjectId.replace(/(\:)/g, '/');

//------------------------------------------------------------------------------
// Setup
//------------------------------------------------------------------------------
(() => {
  let cmd_setup = cmd.addSubFamily('setup', 'Install components');
  cmd_setup.addCommand('typings', 'Setup the TypeScript typings',
      {}, () => {
    fsys.chDir(TOOLS_DIR);
    run.sync('typings install');
    fsys.chDir(WEBAPP_DIR);
    run.sync('typings install');
    fsys.chDir(BASE_DIR);
  });

  cmd_setup.addCommand('yarn', 'Setup yarn/npm subpackages',
      {}, () => {
    fsys.chDir(WEBAPP_DIR);
    run.sync('yarn install');
    fsys.chDir(BASE_DIR);
  });

})();  // Setup

//------------------------------------------------------------------------------
// Build
//------------------------------------------------------------------------------
(() => {
  let cmd_build = cmd.addSubFamily('build',
      'Build components of the projects.');

  const BUILD_WATCH_OPTIONS : cmd_interpreter.OptionsSpec = {
    'watch': {
      description: 'specifying --watch will update the build whenever source ' +
                   'files change',
      can_have_value: false,
    }
  };

  let dev_webapp = cmd_build.addCommand('dev_webapp',
      'Build the development version of the webapp.',
      BUILD_WATCH_OPTIONS, (options:cmd_interpreter.Options) => {
    let bail_or_watch = ('watch' in options) ? '--watch' : '--bail';
    fsys.chDir(WEBAPP_DIR);
    run.sync(`webpack --config=webpack_config/webpack.dev.js --display-error-details ${bail_or_watch}`);
    fsys.chDir(BASE_DIR);
  });

  let prod_webapp = cmd_build.addCommand('prod_webapp',
      'Build the production version of webapp.',
      {}, () => {
    fsys.chDir(WEBAPP_DIR);
    run.sync(`webpack --config=webpack_config/webpack.prod.js --display-error-details`);
    fsys.chDir(BASE_DIR);
  });

  let docker_image = cmd_build.addCommand('docker_image',
      'Build the production docker image for the server.',
      {}, () => {

    run.sync(`docker build -t ${LOCAL_DOCKER_IMAGE_NAME}:prod_img .`);
  });

  let scripts = cmd_build.addCommand('scripts',
      'Build and test the scripts.',
      {}, async () => {
    run.sync(`tsc -p scripts`);

    var Jasmine = require('jasmine');
    var jasmine = new Jasmine();
    jasmine.loadConfig({
      spec_dir: 'build/scripts/',
      spec_files: ['**/*_test.js']
    });
    await (async () => {
      return new Promise((F,_) => { jasmine.execute(F); })
    });
  });

  cmd_build.addCommand('all', 'build everything', {}, () => {
    scripts.interpret([]);

    dev_webapp.interpret([]);

    prod_webapp.interpret([]);

    docker_image.interpret([]);
  });
})();  // build


//------------------------------------------------------------------------------
// Test
//------------------------------------------------------------------------------
(() => {
  let cmd_test = cmd.addSubFamily('test',
      'Run tests');
  cmd_test.addCommand('webapp', 'Run karma tests for the webapp', {}, () => {
    fsys.chDir(WEBAPP_DIR);
    run.sync('karma start');
    fsys.chDir(BASE_DIR);
  });
})();


//------------------------------------------------------------------------------
// Start things
//------------------------------------------------------------------------------
(() => {
  let cmd_start = cmd.addSubFamily('start',
      'Start a server for the project.');

  const run_env = {};

  const RUN_WATCH_OPTION : cmd_interpreter.OptionsSpec = {
    'watch': {
      description: 'specifying --watch will restart the server whenever its ' +
            ' compiled files change',
      can_have_value: false,
    }
  };

  // TODO(ldixon): support env variables, so I can do this:
  // run.sync(`node build/node_http_server/dev/index.js`, {'NODE_ENV':'dev'});

  cmd_start.addCommand('dev_server', 'Start the development server.',
      RUN_WATCH_OPTION, () => {
    fsys.chDir(BASE_DIR);
    const dev_env = { 'NODE_ENV': 'development' };
    run.sync(`node node_modules/@conversationai/perspectiveapi-simple-server/build/server/run_server.js     build/config/dev_server_config.json`,
            { ignore_stdin: true, env: Object.assign({}, run_env, dev_env) });
  });

  cmd_start.addCommand('prod_server', 'Start the production server.',
      {}, () => {
    fsys.chDir(BASE_DIR);
    const prod_env = { 'NODE_ENV': 'production' };
    run.sync(`node node_modules/@conversationai/perspectiveapi-simple-server/build/server/run_server.js     build/config/prod_server_config.json`,
             {env: Object.assign({}, run_env, prod_env)});
  });

  cmd_start.addCommand('prod_docker_server',
      'Start the production server via docker.',
      {}, () => {
    run.sync(`docker run -d -p 8080:8080 ${LOCAL_DOCKER_IMAGE_NAME}:prod_img`);
    log.info(`
      Serving will start on: $(docker-machine ip):8080
      To stop the server run:
        docker stop <name of docker container>
      `);
  });

  cmd_start.addCommand('dev_docker_shell',
      'Start a shell for development and debugging the docker environment.',
      {}, () => {
    run.sync(
      `docker run -v ${BASE_DIR}:/app/external_to_docker \
         -ti -p 8080:8080 -p 8081:8081 \
         ${LOCAL_DOCKER_IMAGE_NAME}:prod_img /bin/bash`);
  });
})();  // start

//------------------------------------------------------------------------------
// Stop things
//------------------------------------------------------------------------------
(() => {
  let cmd_stop = cmd.addSubFamily('stop',
      'Stop a server for the project');
  cmd_stop.addCommand('prod_docker_server',
      'Stop the production server run via docker.',
      {}, async () => {
    let result = await run.async(
      `docker ps -f ancestor=${LOCAL_DOCKER_IMAGE_NAME}:prod_img -q`);
    run.sync(`docker stop ${result.stdout}`);
  });

})();  // stop

//------------------------------------------------------------------------------
// Deploy to cloud
//------------------------------------------------------------------------------
(() => {
  let cmd_deploy = cmd.addSubFamily('deploy',
      'Deploy the current version to gcloud.');
  cmd_deploy.addCommand('gcloud',
`Deploy to gcloud (using root Dockerfile)
    You must set your project and be authenticated:
      gcloud auth login  # Authenticate in your browser.
      gcloud config set project ${config.googleCloudProjectId}
`,
      {}, () => {
    run.sync(`gcloud app deploy --project=${config.googleCloudProjectId}`);
  });

  cmd_deploy.addCommand('gcloud_use_existing_docker_image',
                        'Deploy to gcloud with the current Docker image',
      {}, () => {
    fsys.chDir(BUILD_DIR);
    run.sync('mkdir -p deploy');
    fsys.chDir(path.join(BUILD_DIR, 'deploy'));
    fsys.writeToFile('Dockerfile',
        `FROM gcr.io/${GLCOUD_DOCKER_IMAGE_NAME}/prod`);
    run.sync(`cp ../../app.yaml .`);
    run.sync(`gcloud app deploy --project=${config.googleCloudProjectId}`);
    fsys.chDir(BASE_DIR);
  });

  cmd_deploy.addCommand('gcloud_docker_push',
`Push docker image to gcloud.
    You must set your project and be authenticated:
      gcloud auth login  # Authenticate in your browser.
      gcloud config set project ${config.googleCloudProjectId}
`,
      {}, () => {
    run.sync(
      `docker tag ${LOCAL_DOCKER_IMAGE_NAME}:prod_img \
         gcr.io/${GLCOUD_DOCKER_IMAGE_NAME}/prod`);
    run.sync(
      `gcloud --project=${config.googleCloudProjectId} docker -- \
         push \
         gcr.io/${GLCOUD_DOCKER_IMAGE_NAME}/prod`);
  });
})();

//------------------------------------------------------------------------------
// Actually run... using the arguments from the command line.
//------------------------------------------------------------------------------
(() => {
  let args = process.argv.slice(0);
  args.splice(0, 2);
  cmd.interpret(args);
})();
