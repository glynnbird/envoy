'use strict';

var app = module.exports = require('express')(),
  session = require('express-session'),
  passport = require('passport'),
  compression = require('compression'),
  Cloudant = require('cloudant'),
  bodyParser = require('body-parser'),
  router = require('./lib/routes/index'),
  async = require('async'),
  init = require('./lib/init'),
  events = require('events'),
  ee = new events.EventEmitter(),
  morgan = require('morgan'),
  cors = require('./lib/cors'); 

// Required environment variables
var env = require('./lib/env').getCredentials();

var cloudant = new Cloudant(env.couchHost),
  dbName = app.dbName = env.databaseName;

app.db = cloudant.db.use(dbName);
app.metaKey = 'com_cloudant_meta';
app.events = ee;
app.cloudant = cloudant;
app.serverURL = env.couchHost;


// Setup the logging format
if (env.logFormat !== 'off') {
  app.use(morgan(env.logFormat));
}

function main() {

  // enable cors
  app.use(cors());   
  
  // gzip responses
  app.use(compression());
  
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  // passport for auth
  app.use(session({ secret: 'envoy', maxAge: 60*60*24}));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // authentication routes
  app.use('/', require('./lib/auth').router);
  
  // API routes
  app.use('/', router);

  // Catch 404 and forward to error handler.
  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // Error handlers
  app.use(function(err, req, res) {
    console.error(err.stack);
    res.status(err.statusCode || 500).send('Something broke!');
  });

  app.listen(env.port);
}

// Make sure that any init stuff is executed before
// kicking off the app.
async.series(
  [
    init.verifyDB,
    init.verifySecurityDoc,
    init.installSystemViews
  ],

  function (err, results) {
    for (var result in results) {
      console.log(results[result]);
    }

    if (err != null) {
      process.exit(1);
    }

    main();

    ee.emit('listening');
    console.log('[OK]  main: Started app on', env.url);
  }
);

require("cf-deployment-tracker-client").track();
