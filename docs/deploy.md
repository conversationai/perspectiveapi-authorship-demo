## App Structure and High level Code Layout

This web application consists of a server, expected to run on the cloud within a
docker container, and a webapp that is HTML/CSS/JS that runs in the user's
browser.

 * The node-based http server, built on express is in the `server`
   directory.
 * The angular webapp is in the `webapp` directory.
 * The Dockerfile can be used to deploy the server and webapp on [appengine's
   custom VM](https://cloud.google.com/appengine/docs/flexible/custom-runtimes/) infrastructure, [container
   engine](https://cloud.google.com/container-engine/docs/), or [a generic
   compute engine](https://cloud.google.com/compute/docs/), as well as other
   cloud infrastructure.
 * Some scripts to support development and avoid having to remember quite so
   many commands (in the `scripts` directory).

Problems with this approach:

 * The test environment is not distinguished from the real environment, thus
   using names that match global vars in mocha will probably result in an
   incorrect type-error in your source code, or worse - a runtime error.

## How Build and Serving Work

There are two directories added during development.

 * The `node_modules` directory, in the root of the project, and also in the `
   server` and `webapp` subdirectories, contains libraries that this project
   depends on.
 * The `build` directory which contains temporary files used for building
   the project, and then serving.

Each code module (the development `scripts`, `server`, and `webapp`) has a
subdirectory in the build directory, e.g. the server is in `build/server`. This
directory contains compiled files for both development and production versions
of the code, sourcemaps, and typings. The `typings` directory contains type
definitions for modules and any additional objects in the top level JS context.
Thus the expected directroy structure is:

Both `server` and `webapp` each have their own `package.json` file, and
`node_modules` subdirectories. Like the top level `node_modules` directory,
these are added after an npm install.

Within each code module's root directory, there is a `tsconfig.json` file that
defines the compiler options (e.g. compile to es6 for the server, and es5 for
the browser), and a `typings.json` that defines the type definitions for the
context, and for any npm modules that do not include their typing within their
own directory in `node_modules`. The `src` subdirectory contains TypeScript
source.

Within the `server` subdirectroy there are also two files for running the
server using `pm2` (a node process management tool):

 * `serve_pm2_dev.json` - the config file for pm2 to run a development
   server: it runs a single server process, sets the environment variable
   `NODE_ENV=development`, and it runs the JS from `build/server/dev/index.js`
 * `serve_pm2_prod.json` - the config file for pm2 to run a production server:
   `NODE_ENV=production` you may want to change the number of server processes
   (currently 4). It runs the JS from `build/server/prod/index.js`.

For its part, the server checks the environment variable, and if `NODE_ENV` is
`production` then it serves the webapp HTML from `build/webapp/prod`, and if the
`NODE_ENV` is `development`, then the server serves from `build/webapp/dev`.

#### To run in docker and deploy on gcloud

If you want to deploy an instance in the cloud, you will also need:

 *  [docker](https://www.docker.com/) - used to create a hermetic environment for running the server.
 *  [gcloud](https://cloud.google.com/sdk/gcloud/) - used to deploy the docker image in the cloud.

To deploy the docker image to a cloud instance, you need to be authenticated with gcloud to the project. You can do this from the shell with:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_NAME
```

Make sure you have a docker daemon running, then you can run:

```bash
./act.sh build docker_image
```

To run the server on the docker image, run:

```bash
./act.sh start prod_docker_server
```

To debug problems on the docker server, first run

```bash
docker exec -ti <docker_image_id>  /bin/bash
```

which takes you into the docker shell. Then, you can run

```bash
./act.sh start prod_server
```

to start the server within the docker image.

To get the docker image id, use the command

```bash
docker images
```

which will show a list of docker images.

## Build and test locally

```bash
./act.sh build all
./act.sh test server
```

This will create a `build` directory, and a `node_modules` directory. It will
then run the server integration tests.

You can get back to a fresh state by removing these directories (and their contents).

## To deploy to AppEngine

```bash
./act.sh deploy
```

## To add a new dependency

First, add the npm dependency in whichever module needs it (webapp or server). Do this using

```bash
yarn add <module_name>
```

Then, add the types to the typings.json by installing the typings:

```bash
typings install <module_name> --save
```

Afterwards, make sure the types are downloaded into the build folder. For
example, to add a dependency on the server code to the`supertest library, you
would do this:

```bash
# change directory to the server directory to add the dependency there
cd server
# add npm dependency.
yarn add supertest
# add typings from definitely typed.
typings install dt~supertest --save --global
# Now you edit other typescript files and use the library.
```

To updates the typings in the build directory for the `webapp` and `server`,
run:

```bash
./act.sh setup typings
```

This is called by the npm `postinstall` script. It is not necessary to call
directly if you are rebuilding code without adding new typing dependencies.

Note that there are two types of typings files, global and module level. The
global typings files will be saved to `build/<server or webapp>/typings/globals`
and the module level ones will be saved to
`build/<server or webapp>/typings/modules`. The global types can be used in
.ts files without import, but module level types need to be imported.

To search for typings, you can use the command:

```bash
typings search <module_name>
```

## Troubleshooting

If docker gets its networking state confused, you sometimes need to restart
the background docker service or VM.

When you use the docker service natively (typically in a Linux environment):

```bash
sudo service docker restart
```

If you are working with a [docker-machine](https://docs.docker.com/machine/)
(VM) setup (e.g. on a Mac), to restart the VM you can do:

```bash
docker-machine restart
```

