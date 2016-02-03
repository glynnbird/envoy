var express = require('express');
var router = express.Router();

var app = require('../../app');
var basicAuth = require('basic-auth');
var utils = require('../utils');
var auth = require('../auth');
var _ = require('underscore');

// Delete a document
router.delete('/:db/:id', auth.isAuthenticated, function(req, res) {
  var user = basicAuth(req);
  app.db.get(req.params.id, req.query.rev, function(err, data) {
    // We need a rev in order to delete
    if (!req.query.rev) {
      res.status(409).send({
        error: 'conflict',
        reason: 'Document update conflict.'
      });
      return;
    }
    if (err) {
      utils.sendError(err, res);
      return;
    }

    if (!_.has(data, app.metaKey)) {
      return auth.unauthorized(res);
    }
    var authfield = data[app.metaKey].auth;
    if (!_.has(authfield, 'users')) {
      console.error('Bad auth format for doc id:', data._id);
      return auth.unauthorized(res);
    }

    if (authfield.users.indexOf(user.name) >= 0) {
      app.db.destroy(req.params.id, req.query.rev,
        function(err, data) {
          if (err) {
            utils.sendError(err, res);
            return;
          }
          utils.stripAndSendJSON(data, res);
        }
      );
    } else {
      return auth.unauthorized(res);
    }
  });
});

module.exports = router;
