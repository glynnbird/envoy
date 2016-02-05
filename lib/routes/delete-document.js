'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  basicAuth = require('basic-auth'),
  utils = require('../utils'),
  auth = require('../auth');

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

    if (!data[app.metaKey]) {
      return auth.unauthorized(res);
    }
    var authfield = data[app.metaKey].auth;
    if (!authfield.users) {
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
