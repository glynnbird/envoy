var express = require('express');
var router = express.Router();
var app = require('../../app');
var utils = require('../utils');
var auth = require('../auth');

router.get('/:db', auth.isAuthenticated, function(req, res) {
  app.db.get('', function(err, data) {
    if (err) {
      utils.sendError(err, res);
      return;
    }
    /*jshint camelcase: false */
    data.db_name = req.params.db;
    res.json(data);
  });
});

module.exports = router;
