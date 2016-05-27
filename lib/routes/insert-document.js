'use strict';

var express = require('express'),
	router = express.Router(),
	app = require('../../app'),
	utils = require('../utils'),
	auth = require('../auth');

// Insert a document
router.put('/:db/:id', auth.isAuthenticated(), function(req, res) {

  // 1. Read the new doc
  // 2. Add auth information, user has access
  // 3. Write the doc, return the database response
  var doc = req.body;
  doc[app.metaKey] = {auth: {users: [req.user.username], groups: []}};

  utils.writeDoc(app.db, doc, req, res);
});

module.exports = router;
