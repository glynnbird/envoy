'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  basicAuth = require('basic-auth'),
  utils = require('../utils'),
  auth = require('../auth');

// helper function to call changes feed with _doc_ids filter
function filteredChanges(ids, seq, callback) {
  var qs = {filter: '_doc_ids', style: 'all_docs'};
  if (seq) {
    qs.since = seq;
  }
  app.cloudant.request({
    db: app.dbName,
    path: '_changes',
    qs: qs,
    method: 'POST',
    body: {'doc_ids': ids}
  }, callback);
}

// _changes
//
// Get all owned docs from the users view, and pass this to the CouchDB _changes
// end point with the 'doc_ids' filter. Note: this doesn't work for Cloudant pre
// dbnext, but is supported on CouchDB v1.6.X+
router.get('/:db/_changes', auth.isAuthenticated, function(req, res) {
  var user = basicAuth(req);

  app.db.view('auth', 'userdocs', {key: user.name}, function(err, body) {
    if (err) {
      utils.sendError(err, res);
      return;
    }
    var ids = body.rows.map(function(row) {return row.id;});
    var seq; // comes from request, optional
    if (req.query.since) {
      seq = req.query.since;
    }
    filteredChanges(ids, seq, function(err, body) {
      if (err) {
        utils.sendError(err, res);
        return;
      }
      res.json(body);
    });
  });
});

module.exports = router;
