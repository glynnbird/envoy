var express = require('express');
var router = express.Router();
var app = require('../../app');
var basicAuth = require('basic-auth');
var utils = require('../utils');
var auth = require('../auth');

router.get('/:db/:id', auth.isAuthenticated, function(req, res) {
  // 1. Get the document from the db
  // 2. Validate that the user has access
  // 3. return the document with the auth information stripped out
  app.db.get(req.params.id, function(err, data) {
    if (err) {
      utils.sendError(err, res);
      return;
    }
    var user = basicAuth(req);

    if (!data[app.metaKey]) {
      return auth.unauthorized(res);
    }
    var authfield = data[app.metaKey].auth;
    if (!authfield.users) {
      console.error('Bad auth format for doc id:', data._id);
      return auth.unauthorized(res);
    }
    if (authfield.users.indexOf(user.name) >= 0) {
      utils.stripAndSendJSON(data, res);
    } else {
      return auth.unauthorized(res);
    }
  });
});

module.exports = router;
