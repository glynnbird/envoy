var express = require('express');
var router = express.Router();
var app = require('../../app');
var utils = require('../utils');
var _ = require('underscore');
var basicAuth = require('basic-auth');

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
    var results = _.filter(body.results, function(row) {
      var item = row.docs[0];
      if (_.has(item, 'ok')) {
        var authfield = item.ok[app.metaKey].auth;
        if (!_.has(authfield, 'users')) {
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
