var express = require('express');
var router = express.Router();
var app = require('../../app');
var utils = require('../utils');

router.get('/:db/_local/:key', function(req, res) {
  app.cloudant.request({
    db: app.dbName,
    path: '_local/' + req.params.key
  },
  function (err, body) {
    if (err) {
      utils.sendError(err, res);
      return;
    }
    res.json(body);
  });
});

router.post('/:db/_local/:key', function(req, res) {
  app.cloudant.request({
    db: app.dbName,
    path: '_local/' + req.params.key,
    method: 'POST',
    body: req.body
  },
  function (err, body) {
    if (err) {
      utils.sendError(err, res);
      return;
    }
    res.json(body);
  });
});

module.exports = router;
