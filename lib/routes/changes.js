'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  basicAuth = require('basic-auth'),
  auth = require('../auth'),
  stream = require('stream'),
  // utils = require('../utils'),
  JSONStream = require('JSONStream');

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

  var transformer = function(include_docs) {
    var tr = new stream.Transform({objectMode: true});
    tr._transform = function (obj, encoding, done) {
      if (obj && obj.results && Array.isArray(obj.results)) {
        obj.results.forEach(function (row) {
          if (row.doc) {
            if (!include_docs) {
              delete row.doc;
            } else if (row.doc[app.metaKey]) {
              delete row.doc[app.metaKey];
            }
          }
        });
      }

      // utils.dmp('FILTERED OBJECT', obj);
      this.push(JSON.stringify(obj));
      done();
    };
    return tr;
  };

  var returnDocs = query.include_docs;
  query.filter = 'filters/available';
  query.mbaasuser = basicAuth(req).name;

  app.cloudant.request({
    db: app.dbName,
    path: '_changes',
    qs: query,
    method: 'GET',
  }).pipe(JSONStream.parse()).pipe(transformer(returnDocs)).pipe(res);
});

module.exports = router;
