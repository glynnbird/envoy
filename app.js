'use strict';

var app = module.exports = require('express')();
var Cloudant = require('cloudant');
var bodyParser = require('body-parser');
var router = require('./lib/routes/index');

// Required environment variables
var account = process.env.ACCOUNT;
var key = process.env.API_KEY;
var password = process.env.API_PASSWORD;
var port = parseInt(process.env.PORT, 10);
var databaseName = process.env.MBAAS_DATABASE_NAME;

var cloudant = new Cloudant({
    account: account,
    key: key,
    password: password
});

var dbName = module.exports.dbName = databaseName;
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
