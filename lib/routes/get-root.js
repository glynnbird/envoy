'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app');

router.get('/', function(req, res) {
  app.db.info().pipe(res);
});

module.exports = router;