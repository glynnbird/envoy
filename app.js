'use strict';

var app = module.exports = require('express')();
var Cloudant = require('cloudant');
var creds = require('./creds.json');
var bodyParser = require('body-parser');
var router = require('./lib/routes/index');

var cloudant = new Cloudant(creds);

var dbName = module.exports.dbName = 'mbaas';
module.exports.db = cloudant.db.use(dbName);
module.exports.metaKey = 'com.cloudant.meta';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(err.statusCode || 500).send('Something broke!');
});
