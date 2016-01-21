var express = require('express');
var router = express.Router();

var app = require('../../app');

var basicAuth = require('basic-auth');
var _ = require('underscore');

var utils = require('../utils');
var auth = require('../auth');

// _bulk_docs

router.post('/:db/_bulk_docs', auth.isAuthenticated, function(req, res) {

  /*
    We need to treat separately docs that have ids prefixed with _local
    as PouchDB uses _bulk_docs to update its replication state. This check
    is done first to avoid the view scan.

    Example:

    {
      "docs": [
        {
          "session_id": "D5824987-594B-D074-AA69-EAC6A84F0F8B",
          "_id": "_local/n0ULt1.6S.0ZdB49NrH5jg==",
          "history": [
            {
              "last_seq": "9-g1...lol",
              "session_id": "D5824987-594B-D074-AA69-EAC6A84F0F8B"
            }
          ],
          "replicator": "pouchdb",
          "version": 1,
          "last_seq": "9-g1...lol"
        }
      ],
      "new_edits": true
    }

    Assumption: if there is a single doc with its _id starting
    with '_local' we send this request through as-is.
  */

  /*jshint camelcase: false */
  var newEdits = _.has(req.body, 'new_edits') ? req.body.new_edits : false;

  if (_.has(req.body, 'docs') &&
    req.body.docs.length === 1 &&
    req.body.docs[0]._id.startsWith('_local/')) {
    app.db.bulk(req.body, function(err, body) {
      if (err) {
        utils.sendError(err, res);
        return;
      }
      res.json(body);
    });
  } else {

    // Iterate through docs
    var ids = {'keys': _.map(req.body.docs, function(doc) {
      return doc._id;
    })};

    // For now we don't care about _rev in this hash but we will do later...
    var docsById = _.reduce(req.body.docs, function(hash, doc) {
      hash[doc._id] = doc;
      return hash;
    }, {});

    // TODO Although we ask for conflicts, we don't handle them yet.

    // for each doc check we have permissions correct
    // if true, upload doc
    // otherwise error

    var user = basicAuth(req);
    app.db.fetch(ids, {'conflicts': true}, function(err, body) {
      var goodDocs = _.filter(body.rows, function(row) {
        if (row.doc) { // This could be tweaked to handle new docs properly
          var authdata = row.doc[app.metaKey].auth;
          return (authdata.users.indexOf(user.name) >= 0);
        }
      }).map(function(row) {
        var newDoc = docsById[row.doc._id];
        var authdata = row.doc[app.metaKey].auth;
        // Overwrite the auth from the previous doc
        newDoc[app.metaKey] = {'auth': authdata};
        return newDoc;
      });

      var badDocs = _.filter(body.rows, function(row) {
        // Docs that exist but don't have correct auth
        if (row.doc) {
          var authdata = row.doc[app.metaKey].auth;
          return authdata.users.indexOf(user.name) === -1;
        } else {
          return false;
        }
      });

      // Find any new docs, which are reported back as errors from the
      // fetch() call.
      var newDocs = _.filter(body.rows, function(row) {
        return _.has(row, 'error') &&
          _.has(row, 'key') &&
          row.error === 'not_found';
      }).map(function(row) { // Need to insert the auth field
        var newDoc = docsById[row.key];
        newDoc[app.metaKey] = {auth: {users:[user.name], groups:[]}};
        return newDoc;
      });

      // TODO Deal with bad docs and tell the user (or replicator?)
      app.db.bulk({docs: _.union(goodDocs, newDocs), new_edits: newEdits},
        function(err, body) {
        if (err) {
          utils.sendError(err, res);
          return;
        }
        res.json(body);
      });
    });
  }
});

module.exports = router;
