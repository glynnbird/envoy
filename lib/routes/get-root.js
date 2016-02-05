'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  request = require('request');

router.get('/', function(req, res) {
  request(app.serverURL).pipe(res);
});

module.exports = router;