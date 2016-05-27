'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  utils = require('../utils'),
  auth = require('../auth'),
  databaseName = process.env.MBAAS_DATABASE_NAME;

// Given a set of docids, callback on the subset for which
// the auhenticated user have no access
function badDocsByKeys(idlist, username, callback/*(err, bad)*/) {
  app.db.fetch({'keys': idlist}, {'conflicts': true}, function(err, body) {
    if (err) {
      callback(err, []);
      return;
    }
    var bad = [];
    body.rows.forEach(function(row) {
      if (row.doc) {
        var authfield = row.doc[app.metaKey].auth;
        if (!authfield.users) {
          console.error('Bad auth format for doc id:', row.doc._id);
          bad.push(row);
          return;
        }
        if (authfield.users.indexOf(username) === -1) {
          bad.push(row);
        }
      }
    });

    callback(null, bad);
  });
}

// Authenticated request to _revs_diff.
//
// Possible states per {docid, revid} tuple:
//
// 1. New document id that server has never seen:
//
//  Return {docid:{missing: [revid]}}
//
// 2. Existing docid where user has access to current leaf:
//
//  Return either {docid:{missing: [revid]}} or nothing depending on
//  whether it's present
//
// 3. Existing docid where user does not have access to current leaf:
//
//  Return {docid:{missing: [revid]}} (even though it is actuall NOT missing)
//
// The last state whilst not representing a leak at this point will
// result in a 401 for a subsequent POST, but this is true for a POST
// anyway (a.k.a 'winning the lottery').
//
// The Cloudant/Nano library does not support the revsDiff API end point
// directly, so we use the cloudant.request() call to roll our own.

router.post('/:db/_revs_diff', auth.isAuthenticated(), function(req, res) {
  // Authenticate the documents requested
  badDocsByKeys(Object.keys(req.body), req.user.username, function(err, inaccessible) {
    if (err) {
      utils.sendError(err, res);
      return;
    }

    // Now we can revs_diff
    app.cloudant.request({
      db: databaseName,
      path: '_revs_diff',
      method: 'POST',
      body: req.body
    },
    function (err, body) {
      if (err) {
        utils.sendError(err, res);
        return;
      }
      // All items reported as missing (body) can be passed back.
      // Additionally we need to check items requested that
      // although present are not accessible - these also need
      // to be reported as missing to not leak information.
      inaccessible.forEach(function(item) {
        if (body[item.id]) {
          body[item.id].missing.push(item.value.rev);
        } else {
          body[item.id] = {
            missing: [item.value.rev]
          };
        }
      });

      res.json(body);
    });
  });
});

module.exports = router;
