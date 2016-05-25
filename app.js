'use strict';

var app = module.exports = require('express')(),
  compression = require('compression'),
  Cloudant = require('cloudant'),
  bodyParser = require('body-parser'),
  router = require('./lib/routes/index'),
  async = require('async'),
  init = require('./lib/init'),
  events = require('events'),
  ee = new events.EventEmitter(),
  morgan = require('morgan'),
  fs = require('fs'),
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

// Set up the logging directory
var logDirectory = __dirname + '/logs';
if (!fs.existsSync(logDirectory)) {
   fs.mkdirSync(logDirectory);
}

// Create a write stream (in append mode)
var accessLogStream =
  fs.createWriteStream(logDirectory + '/access.log', {flags: 'a'});

// Setup the logger
app.use(morgan('dev', {stream: accessLogStream}));

function main() {

  // enable cors
  app.use(cors());   
  
  // gzip responses
  app.use(compression());
  
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

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
