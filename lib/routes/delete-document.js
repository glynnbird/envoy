var express = require('express');
var router = express.Router();

var app = require('../../app');
var basicAuth = require('basic-auth');
var utils = require('../utils');
var auth = require('../auth');

// Delete a document
router.delete('/:db/:id', auth.isAuthenticated, function(req, res) {
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
    var user = basicAuth(req);
    var auth = data[app.metaKey].auth;
    if (auth.users.indexOf(user.name) >= 0) {
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
