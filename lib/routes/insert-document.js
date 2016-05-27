'use strict';

var express = require('express'),
	router = express.Router(),
	app = require('../../app'),
	basicAuth = require('basic-auth'),
	utils = require('../utils'),
	auth = require('../auth');

// Insert a document
router.put('/:db/:id', auth, function(req, res) {

  // 1. Read the new doc
  // 2. Add auth information, user has access
  // 3. Write the doc, return the database response
  var doc = req.body;
  var user = basicAuth(req);
  doc[app.metaKey] = {auth: {users: [user.name], groups: []}};

  utils.writeDoc(app.db, doc, req, res);
});

module.exports = router;
