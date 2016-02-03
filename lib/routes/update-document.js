var express = require('express');
var router = express.Router();

var basicAuth = require('basic-auth');
var app = require('../../app');
var utils = require('../utils');
var auth = require('../auth');

// Update a document
router.post('/:db/:id', auth.isAuthenticated, function(req, res) {

  // 1. Get the document from the db
  // 2. Validate that the user has access
  // 3. Write the doc with the auth information added back in,
  //  return the database response
  app.db.get(req.params.id, function(err, data) {
    if (err) {
      utils.sendError(err, res);
      return;
    }
    var user = basicAuth(req);

    if (!data[app.metaKey]) {
      console.log('Unexpected doc: ', JSON.stringify(data, null, 4));
      return auth.unauthorized(res);
    }

    var authfield = data[app.metaKey].auth;
    if (!authfield.users) {
      console.error('Bad auth format for doc id:', data._id);
      return auth.unauthorized(res);
    }

    if (authfield.users.indexOf(user.name) >= 0) {
      var doc = req.body;
      doc[app.metaKey] = {'auth': authfield};
      // TODO - should we require the user to send the current _rev
      // also need to propagate 409 correctly
      doc._rev = data._rev;
      utils.writeDoc(app.db, doc, req, res);
    } else {
      return auth.unauthorized(res);
    }
  });
});

module.exports = router;
