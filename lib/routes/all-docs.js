/*
  CouchDB 2 will support the filtering of _all_docs by id, but
  unfortunately at the time of writing this is not implemented
  correctly for dbnext, hence the heath-robinson solution below.
*/

var express = require('express');
var router = express.Router();
var app = require('../../app');
var basicAuth = require('basic-auth');
var _ = require('underscore');
var utils = require('../utils');
var auth = require('../auth');

router.get('/:db/_all_docs', auth.isAuthenticated, function(req, res) {
  var user = basicAuth(req);

  // Workaround for small bug in nano to avoid double-encoding
  if (_.has(req.query, 'keys')) {
    req.query.keys = JSON.parse(req.query.keys);
  }

  /*jshint camelcase: false */
  var includeDocs = req.query.include_docs;

  // force docs to be included
  // TODO: strip these out from the response
  req.query.include_docs = true;

  app.db.list(req.query, function (err, body) {
    if (err) {
      utils.sendError(err, res);
      return;
    }
    var data = _.filter(body.rows, function (row) {
      if (!row.doc[app.metaKey]) { // Skip non-meta'ed docs
        return false;
      }
      var auth = row.doc[app.metaKey].auth;
      var accessible = auth.users.indexOf(user.name) >= 0;
      delete row.doc[app.metaKey];
      return accessible;
    });
    // NOTE: what is the correct way to deal with the 'total_rows' part?
    body.rows = data;
    res.json(body);
  });
});

router.post('/:db/_all_docs', auth.isAuthenticated, function(req, res) {
  var user = basicAuth(req);

  app.db.fetch(req.body, function (err, body) {
    if (err) {
      utils.sendError(err, res);
      return;
    }
    var data = _.filter(body.rows, function (row) {
      if (!row.doc[app.metaKey]) { // Skip non-meta'ed docs
        return false;
      }
      var auth = row.doc[app.metaKey].auth;
      var accessible = auth.users.indexOf(user.name) >= 0;
      delete row.doc[app.metaKey];
      return accessible;
    });
    // NOTE: what is the correct way to deal with the 'total_rows' part?
    body.rows = data;
    res.json(body);
  });
});

module.exports = router;
