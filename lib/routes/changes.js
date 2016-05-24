'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  basicAuth = require('basic-auth'),
  auth = require('../auth'),
  utils = require('../utils'),
  stream = require('stream');

// _changes

router.get('/:db/_changes', auth.isAuthenticated, function(req, res) {

  var query = req.query || {};
  if (query.filter) {
    res.status(401).send({
      error: 'unauthorized',
      reason: 'Unauthorized.'
    });
    return;
  }

  query.filter = 'filters/available';
  query.mbaasuser = basicAuth(req).name;

  // Short cut: if no include_docs, we can pipe the response as is.
  if (!query.include_docs) {
    app.cloudant.request({
      db: app.dbName,
      path: '_changes',
      qs: query,
      method: 'GET',
    }).pipe(res);
  } else {
    app.cloudant.request({
      db: app.dbName,
      path: '_changes',
      qs: query,
      method: 'GET',
    }).pipe(utils.liner()).pipe(utils.authRemover()).pipe(res);
  }
});

module.exports = router;
