[![Travis CI](https://travis-ci.org/conversationai/perspectiveapi-authorship-demo.svg?branch=master)](https://travis-ci.org/conversationai/perspectiveapi-authorship-demo) [![npm version](https://badge.fury.io/js/%40conversationai%2Fperspectiveapi-authorship-demo.svg)](https://badge.fury.io/js/%40conversationai%2Fperspectiveapi-authorship-demo)

# An authorship experience demo of the perspective API

This repository contains example code for an authorship experience that provides feedback as you type using the [Perspective API](http://www.perspectiveapi.com/). It is a web app written in
[Angular2](https://angular.io/)/[TypeScript](https://www.typescriptlang.org/) and uses a [node express server](https://expressjs.com/). This project shows how to have a development and a production
build environment with deployment tools based on [Docker](https://www.docker.com/). This makes it easy be deployed to cloud services such as Google Cloud's flexible appengine environment, as well as other cloud computing providers.

The app uses the [Perspective API](http://www.perspectiveapi.com/) to score text, via a
the [perspectiveapi-simple-server](https://github.com/conversationai/perspectiveapi-simple-server).

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.0.0.

## Requirements & Setup

To run code using your local machine (not via the docker
environment), you will need to install `nodejs` (e.g., by [installing NVM](https://github.com/creationix/nvm)). You'll also need some global packages which you can install using the `npm` command:

```bash
npm install -g yarn typings typescript ts-node mocha protractor angular-cli karma-cli
```

Next, you will need to create a
[Google Cloud Project](http://cloud.google.com) project, and it will need to have access the [PerspectiveAPI](https://www.perspectiveapi.com). Requests to the API will be authenticated using an [cloud project API key](https://support.google.com/cloud/answer/6158862?hl=en).

An example configuration file template is provided in `config/server_config.template.json`. If one is not present in `build/config`, then the config file will be copied there when you build or start a local server. The config file specifies your google-cloud project API key, and some other details which you can learn more about in the [documentation for perspectiveapi-simple-server](https://github.com/conversationai/perspectiveapi-simple-server/blob/master/README.md).

To setup and install the local packages, run:

```bash
yarn install
```

### Adding reCAPTCHA v3 verification

The [perspectiveapi-simple-server](https://github.com/conversationai/perspectiveapi-simple-server) 
has an optional configuration for enabling reCAPTCHA verification. To enable it in this demo, add the 
requisite `recaptchaConfig` values to `server_config.json`. Then, provide [ng-recaptcha](https://github.com/DethAriel/ng-recaptcha)'s  `RecaptchaV3Service` and `RECAPTCHA_V3_SITE_KEY` to the module importing this demo, like so:

```js
providers: [ 
  ReCaptchaV3Service,
  {provide: RECAPTCHA_V3_SITE_KEY, useValue: 'your_site_key_for_reCAPTCHA_v3' },
]
```

## Development server that watches the source code

Run `yarn run serve` for a dev server. Navigate to `http://localhost:4200/`.
The app will automatically reload if you change any of the source files.
API requests to the server (`http://localhost:4200/check` and
`http://localhost:4200/suggest_score`) will be redirected to an underlying nodejs server,
based on [perspectiveapi-simple-server](https://github.com/conversationai/perspectiveapi-simple-server),
which is started at `http://localhost:8080/`.

## Development server that uses compiled sources

Builds the app in `build/static`:

```bash
yarn build:dev
```

Start the simple server at `http://localhost:8080/` serving content from `build/static`:

```bash
yarn run start:dev-server
```

## Production server that uses compiled sources

To build the production version of the app in `build/static`, which will compile the HTML, JS and CSS
and do cool shakedown stuff to minimize the size, run:

```
yarn build:prod
```

You can now run the simple server at `http://localhost:8080/` serving content from `build/static`:

```bash
yarn run start:dev-server
```

When run using the Dockerfile, e.g. on [Google Cloud](https://cloud.google.com/sdk/gcloud/), the following command will be run:

```bash
yarn run start:prod-server
```

If you run this locally, you'll need to [login to google cloud and set your project id](https://cloud.google.com/sdk/docs/initializing).
If you run this locally, you'll need to [login to google cloud and set your project id](https://cloud.google.com/sdk/docs/initializing).

## Production server using docker file

Assuming you have [docker](https://www.docker.com/) installed and setup, you can create a docker-image for the prod server with:

```bash
docker build -t perspectiveapi-authorship-demo .
```

To start a shell in the docker environment for debugging and to manually start
the server there, you can run:

```bash
docker run -ti perspectiveapi-authorship-demo /bin/bash
```

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive/pipe/service/class/module`.

## Build

Run `yarn run build` to build the project. The build artifacts will be stored in the `build/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `yarn run test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `yarn run e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Using convai-checker as a webcomponent

Angular Elements is a new experimental API that allows exporting Angular
components as webcomponents. This repo includes a demo of this functionality
with the convai-checker component. To
see it, do the following:
1. Build with the command yarn run build:dev-customElements.
2. Run yarn run start:dev-server
3. Open http://localhost:8080/index_with_elements.html.

TODO(rachelrosen): Document and demo how to add convai-checker webcomponent outside of the angular-cli build using the imported compiled javascript.

### Publishing the webcomponent

To publish a new version of the convai-checker webcomponent, that can be used as a plugin in other websites (e.g. WordPress):
1. Run `yarn run build-plugin-js`.  This will concatenate all JavaScript files into one `build/static/perspective_authorship_widget.js` file.
2. Copy the new JavaScript to GCS with `gsutil cp build/static/perspective_authorship_widget.js gs://checker_source/`
3. Copy asset files (emoji images) to GCS with `gsutil cp src/assets/* gs://checker_source/assets`
4. Open (https://pantheon.corp.google.com/storage/browser/checker_source) and ensure that perspective_authorship_widget.js and all files in the assets directory have "Public link" checked.  TODO(dborkan): automate this step

## Publishing to npm

To package the library for publication, we use [ng-packagr](https://github.com/dherges/ng-packagr).

Run `yarn run packagr` to build the javascript bundles, which will generate a
`dist/` directory. Then run `npm publish dist` to publish the contents of that
directory.

### Important note

When using this library in another package, in order to access the image assets
for emoji mode, you must add the assets from this package to the assets in your
angular.json:

"assets": [
   {
     "glob": "*",
     "input": "node_modules/@conversationai/perspectiveapi-authorship-demo/src/assets",
     "output": "./assets"
   }
]

See https://github.com/angular/angular-cli/issues/3555#issuecomment-285187411
and https://github.com/angular/angular-cli/pull/4691 for more info.

## Notes

This is example code to help experimentation with the Perspective API; it is not an official Google product.
