FROM gcr.io/google_appengine/nodejs

# Undo the env variable setting from the google nodejs env.
# We set NODE_ENV ourself when we run the server, rather than have a global
# setting which messes with npm install.
ENV NODE_ENV ''

RUN apt-get -q update && \
    apt-get install --no-install-recommends -y -q \
      nano less memcached rsync vim

# Install node/npm
#
# TODO: google-cloud-node is broken for node 7.1:
#  https://github.com/GoogleCloudPlatform/google-cloud-node/issues/1753
# RUN install_node 7.1
#
RUN install_node 6.9

# Install Yarn.
# Note: because this is running as super-user in docker, we need to specify the
# --unsafe-perm flag to allow npm not to worry about downgrading its
# permissions.
#
RUN npm install -g --unsafe-perm yarn@0.18.1

# `pm2` runs the production server, retsarting if it crashes, etc.
# `protractor` is used for testing angular2 components.
# `ts-node` allows typesscipt scripts to executed inline, like node/js.
# `typescript` is the programming language and compiler for javascript.
# `typings` provides type definitions for typescript needed to compile code.
# `webpack` is used to combine/bundle the HTML/CSS/JS, produce source maps, etc.
RUN yarn global add \
  pm2 \
  protractor \
  ts-node \
  typescript@2.1.4 \
  typings@1.5.0 \
  webpack

ADD package.json app.yaml act.sh yarn.lock LICENSE /app/
ADD build/config /app/build/config
ADD config /app/config
ADD scripts /app/scripts
ADD webapp /app/webapp

RUN cd /app/ && yarn install

WORKDIR /app/

RUN yarn run setup
RUN ["./act.sh", "build", "prod_webapp"]

# Assumes: `EXPOSE 8080` and `ENV PORT 8080`
CMD ./act.sh start prod_server
