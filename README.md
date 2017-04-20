# Demo of an authorship experience based on the perspective API

A demo authorship experience that provides perspective API feedback as you type.

This is a web app written in [Angular2](https://angular.io/) with a [node express
server](https://expressjs.com/). This illustrates having both a development and a production
build environment with deployment tools based on
[Docker](https://www.docker.com/).
Code is in [TypeScript](https://www.typescriptlang.org/).
The app uses the [Perspective API](http://www.perspectiveapi.com/) to score text, via a
the [perspectiveapi-simple-server](https://github.com/conversationai/perspectiveapi-simple-server).

## Prerequisites

To run code using your local machine (not via the docker
environment), install:
* The `nodejs` dependency (e.g., by [installing NVM](https://github.com/creationix/nvm)).

*Note: for detailed background information on these steps, see the [Deployment Guide](docs/deploy.md).*

Once you have downloaded the source code and are in the github directory, install the global npm dependencies used by the project by running:

```bash
npm install -g yarn typings typescript ts-node webpack pm2 mocha protractor karma-cli
```
*  `protractor` is used for Angular2 testing.
*  `typescript` is the programming language and compiler for javascript.
    Note that the current build is stable using typescript version 2.0.8,
    but not later versions.
*  `typings` provides type definitions for typescript needed to compile
    code.
*  `ts-node` allows typesscipt scripts to executed inline, like node/js.
*  `webpack` is used to combine/bundle the HTML/CSS/JS, produce source
    maps, etc.
*  `pm2` runs the production server, restarting if it crashes, etc.
*  `karma-cli` runs tests.

Next, you will need to create a
[Google Cloud Project](http://cloud.google.com) project, and it will need to have access the [PerspectiveAPI](https://www.perspectiveapi.com). Requests to the API will be authenticated using an [cloud project API key](https://support.google.com/cloud/answer/6158862?hl=en).

## Install and setup

To setup and install the local packages, run:

```bash
yarn install
yarn setup
```

This installs local dependencies, and creates your config files from the  templates. There is a config file for the server and for deployment. The setup command also installs typings and node modules.

The server config files are `build/config/dev_server_config.json` and
`build/config/prod_server_config.json`. Before running in dev mode, open
`build/config/dev_server_config.json` and add your API key and static
path for the webapp code to the config file. The default static path for the dev
server is `build/webapp/dev`. You will need to edit `prod_server_config.json` to run in prod mode. The default static path for the prod configuration is `build/webapp/prod`

Note: Only edit the config files under `build/config`. The template file
`config/deploy_config.template.json` is used as a template reference for the
repository but is not directly referenced by any build or serving commands.

Your deploy config is located at `build/config/deploy_config.json`. You can run
locally without updating your deploy config, but in order to deploy
to app-engine you will need to edit it to use your Google cloud project id
instead of the placeholder.

Now build the project and start serving:

```bash
./act.sh build dev_webapp
./act.sh start dev_server
```

When the commands have run successfully, you can open the site in your browser at http://localhost:8081/ (or whatever port you specified in you config).

## Troubleshooting

After starting the `dev_server`:

* If you receive the error message `foo: resulted in error code: null`, make sure you included package `foo` in your npm dependencies above.

* If you receive an error stating "API Key Not Valid," make sure you have requested an API Key from the conversationai team, and have Enabled the API "Google Comment Analyzer" in the above steps.

## Notes

This is only some example code to help experimentation with the Perspective API; it is not an official Google product.
