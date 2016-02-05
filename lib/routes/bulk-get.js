'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  utils = require('../utils'),
  basicAuth = require('basic-auth');

// Pouch does this to check it exists
router.get('/:db/_bulk_get', function(req, res) {
  app.cloudant.request({
    db: app.dbName,
    path: '_bulk_get'
  },
  function (err, body) {
    if (err) {
      utils.sendError(err, res);
      return;
    }
    res.json(body);
  });
});

router.post('/:db/_bulk_get', function(req, res) {
  var user = basicAuth(req);
  app.cloudant.request({
    db: app.dbName,
    path: '_bulk_get',
    method: 'POST',
    body: req.body
  },
  function (err, body) {
    if (err) {
      utils.sendError(err, res);
      return;
    }
    var results = body.results.filter(function(row) {
      var item = row.docs[0];
      if (item.ok) {
        var authfield = item.ok[app.metaKey].auth;
        if (!authfield.users) {
          console.error('Bad auth format for doc id:', item.ok._id);
          return false;
        }
        var accessible = authfield.users.indexOf(user.name) >= 0;
        delete item.ok[app.metaKey];
        return accessible;
      }
      return true;
    });
    res.json({results: results});
  });
});

module.exports = router;
