'use strict';

/*
  CouchDB 2 will support the filtering of _all_docs by id, but
  unfortunately at the time of writing this is not implemented
  correctly for dbnext, hence the heath-robinson solution below.
*/

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  basicAuth = require('basic-auth'),
  utils = require('../utils'),
  auth = require('../auth');

router.get('/:db/_all_docs', auth.isAuthenticated, function(req, res) {
  var user = basicAuth(req);

  // Workaround for small bug in nano to avoid double-encoding
  if (req.query.keys) {
    req.query.keys = JSON.parse(req.query.keys);
  }

  // force docs to be included
  // TODO strip these out from the response
  req.query.include_docs = true;

  app.db.list(req.query)
    .pipe(utils.liner())
    .pipe(utils.authRemover(user.name))
    .pipe(res);
    
});

router.post('/:db/_all_docs', auth.isAuthenticated, function(req, res) {
  var user = basicAuth(req);

  app.db.fetch(req.body)
    .pipe(utils.liner())
    .pipe(utils.authRemover(user.name))
    .pipe(res);
  
});

module.exports = router;
