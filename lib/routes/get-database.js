'use strict';

var express = require('express'),
	router = express.Router(),
	app = require('../../app'),
	utils = require('../utils'),
	auth = require('../auth');

router.get('/:db', auth, function(req, res) {
  app.db.get('', function(err, data) {
    if (err) {
      utils.sendError(err, res);
      return;
    }
    data.db_name = req.params.db;
    res.json(data);
  });
});

module.exports = router;
