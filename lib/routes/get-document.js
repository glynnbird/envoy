var express = require('express');
var router = express.Router();

var app = require('../../app');
var basicAuth = require('basic-auth');

var utils = require('../utils');
var auth = require('../auth');

router.get('/:id', auth.isAuthenticated, function(req, res) {
  // 1. Get the document from the db
  // 2. Validate that the user has access
  // 3. return the document with the auth information stripped out
  app.db.get(req.params.id, function(err, data) {
    if (err){
      console.log(err);
      res.status(err.statusCode).send({
        error: err.error,
        reason: err.reason
      });
    } else {
      console.log(data[app.metaKey]);
      var user = basicAuth(req);
      var auth = data[app.metaKey].auth;
      if (auth.users.indexOf(user.name) >= 0) {
        utils.stripAndSendJSON(data, res);
      } else {
        return auth.unauthorized(res);
      }
    }
  });
});

module.exports = router;
