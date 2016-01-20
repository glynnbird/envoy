var express = require('express');
var router = express.Router();

var app = require('../../app');
var basicAuth = require('basic-auth');

var utils = require('../utils');
var auth = require('../auth');

// Insert a document
router.put('/:id', auth.isAuthenticated, function(req, res) {

  // 1. Read the new doc
  // 2. Add auth information, user has access
  // 3. Write the doc, return the database response
  var doc = req.body;
  var user = basicAuth(req);
  doc[app.metaKey] = {'auth': {'users':[user.name]}};

  utils.writeDoc(app.db, doc, req, res);
});

module.exports = router;
