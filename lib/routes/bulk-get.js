'use strict';

// NOTE: The _bulk_get end point does not return its results line-by-line
// as e.g. _changes.
//
// NOTE: The response format is convoluted, and seemingly undocumented.
//
//  "results": [
// {
//   "id": "1c43dd76fee5036c0cb360648301a710",
//   "docs": [
//     {
//       "ok": { ..doc body here...
//
//         }
//       }
//     }
//   ]
// },
//
// Not sure if the "docs" array can ever contain multiple items.

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  utils = require('../utils'),
  basicAuth = require('basic-auth');

// Pouch does this to check it exists
router.get('/:db/_bulk_get', function(req, res) {
  app.cloudant.request({
    db: app.dbName,
    qs: req.query || {},
    path: '_bulk_get'
  }).pipe(res);
});

router.post('/:db/_bulk_get', function(req, res) {
  var user = basicAuth(req);
  app.cloudant.request({
    db: app.dbName,
    qs: req.query || {},
    path: '_bulk_get',
    method: 'POST',
    body: req.body
  }, function (err, data) {
    if (err) {
      utils.sendError(err, res);
      return;
    }
    res.json({results: data.results.filter(function (row) {
      if (row.docs && row.docs[0].error) {
        return true;
      }
      // The assumption here is that if the docs array contain
      // multiple entries (this is unclear) we get away with 
      // making the filter selection based on the first only.
      if (row.docs && row.docs[0].ok && row.docs[0].ok[app.metaKey]) {
        var authfield = row.docs[0].ok[app.metaKey].auth;
        return authfield.users.indexOf(user.name) >= 0;
      }
      return false;
    }).map(function (row) {
      if (!row.docs.error) {
        // No mutation in maps
        var stripped = Object.assign({}, row);
        stripped.docs.forEach(function (item) {
          delete item.ok[app.metaKey];
        });
        
        return stripped;
      }
      return row;
    })});
  });
});

module.exports = router;