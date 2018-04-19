FROM gcr.io/google_appengine/nodejs

# Undo the env variable setting from the google nodejs env.
# We set NODE_ENV ourself when we run the server, rather than have a global
# setting which messes with npm install.
ENV NODE_ENV ''

RUN apt-get -q update && \
    apt-get install --no-install-recommends -y -q \
      nano less memcached rsync vim

# Install node/npm using LTS version
#
RUN install_node 8.9.0

# Install Yarn.
# Note: because this is running as super-user in docker, we need to specify the
# --unsafe-perm flag to allow npm not to worry about downgrading its
# permissions.
#
RUN npm install --unsafe-perm -g yarn

# `angular-cli` is used to build the app.
# `ts-node` allows typesscipt scripts to executed inline, like node/js.
# `typescript` is the programming language and compiler for javascript.
# `typings` provides type definitions for typescript needed to compile code.
RUN yarn global add \
  angular-cli \
  ts-node \
  typescript@2.2.2 \
  typings

# Add local files into the docker filespace.
# Assumes that .dockerfile ignores nodes node_modules
ADD . /app/

WORKDIR /app/

RUN yarn install
RUN yarn run build:prod

# Assumes: `EXPOSE 8080` and `ENV PORT 8080`
CMD yarn start:prod-server
