'use strict';

var app = module.exports = require('express')();
var Cloudant = require('cloudant');
var bodyParser = require('body-parser');
var router = require('./lib/routes/index');
var utils = require('./lib/utils');
var async = require('async');
var init = require('./lib/init');
var events = require('events');
var ee = new events.EventEmitter();

// Required environment variables
var env = require('./lib/env').getCredentials();

var cloudant = new Cloudant({
  account: env.account,
  key: env.key || env.username,
  password: env.password
});

var dbName = app.dbName = env.databaseName;
app.db = cloudant.db.use(dbName);
app.metaKey = 'com.cloudant.meta';
app.events = ee;

function main() {
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
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(err.statusCode || 500).send('Something broke!');
  });

  app.listen(env.port);
  console.log("[OK]  msin: Started app on", env.url);
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
  }
);
