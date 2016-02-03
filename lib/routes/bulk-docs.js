var express = require('express');
var router = express.Router();

var app = require('../../app');

var basicAuth = require('basic-auth');
var _ = require('underscore');

var utils = require('../utils');
var auth = require('../auth');

// _bulk_docs

router.post('/:db/_bulk_docs', auth.isAuthenticated, function(req, res) {
  // This is a special PouchDB-case. Although it could be handled below,
  // it's factored out to avoid an extra round trip.
  if (_.has(req.body, 'docs') &&
    req.body.docs.length === 1 &&
    _.has(req.body.docs[0], '_id') &&
    req.body.docs[0]._id.startsWith('_local/')) {
    app.db.bulk(req.body, function(err, body) {
      if (err) {
        utils.sendError(err, res);
        return;
      }
      res.json(body);
    });
    return;
  }

  /*jshint camelcase: false */
  var newEdits = _.has(req.body, 'new_edits') ? req.body.new_edits : true;
  var user = basicAuth(req);
  var newDocAuth = {auth: {users:[user.name], groups:[]}};

  // Iterate through docs, gathering ids where given
  var doclist = _.reduce(req.body.docs, function(acc, doc) {
    if (_.has(doc, '_id')) {
      // TODO For now we don't care about _rev in this hash but we may later
      acc.byId[doc._id] = doc;
    } else { // No _id: request to create a new document
      doc[app.metaKey] = newDocAuth;
      acc.new.push(doc);
    }
    return acc;
  }, {byId: {}, new: [], good: [], bad: []});

  // If we have no docs given with ids, we can save a round trip
  if (_.isEmpty(doclist.byId)) {
    app.db.bulk({docs: doclist.new, new_edits: newEdits},
      function(err, body) {
      if (err) {
        utils.sendError(err, res);
        return;
      }
      res.json(body);
    });
    return;
  }

  // TODO Although we ask for conflicts, we don't handle them yet
  app.db.fetch({keys: _.keys(doclist.byId)}, {'conflicts': true},
    function(err, body) {
    if (err) {
      utils.sendError(err, res);
      return;
    }

    // Sort the docs in a good and bad pile, by auth check.
    // Also check for new docs with user-assigned ids, which
    // will come through as errors from the filtered fetch()
    // call.
    doclist = _.reduce(body.rows, function(acc, row) {
      if (_.has(row, 'error') && _.has(row, 'key') &&
        row.error === 'not_found') {
          // New doc with user-assigned id (non-existing). Add
          // to the new list
          var newdoc = acc.byId[row.key]; // Grab doc from original query
          newdoc[app.metaKey] = authdata; // Add the authdata
          acc.new.push(newdoc);
      } else if (_.has(row, 'doc') && _.has(row.doc, app.metaKey)) {
        var authdata = row.doc[app.metaKey].auth;
        if (authdata.users.indexOf(user.name) >= 0) { // Accessible!
          var doc = acc.byId[row.doc._id]; // Grab doc from original query
          doc[app.metaKey] = authdata;     // Add the authdata
          acc.good.push(doc);
        } else { // Inaccessible. We only care about the id
          acc.bad.push(row.doc._id);
        }
      }
      return acc;
    }, doclist);

    // We can now bulk-doc the good and new piles.
    app.db.bulk({docs: _.union(doclist.good, doclist.new),
      new_edits: newEdits},
      function(err, body) {
      if (err) {
        utils.sendError(err, res);
        return;
      }
      // Inject the docs that didn't pass the auth check as errors
      _.each(doclist.bad, function(badid) {
        body.push({error: 'forbidden', id: badid, reason: 'unauthorized'});
      });
      res.json(body);
    });
  });
});

module.exports = router;
