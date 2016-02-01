var express = require('express');
var router = express.Router();
var app = require('../../app');
var request = require('request');

router.get('/', function(req, res) {
  request(app.serverURL).pipe(res);
});

module.exports = router;
