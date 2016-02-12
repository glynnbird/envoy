'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app');

router.get('/:db/_local/:key', function(req, res) {
  app.cloudant.request({
    db: app.dbName,
    path: '_local/' + req.params.key
  }).pipe(res);
});

router.post('/:db/_local/:key', function(req, res) {
  app.cloudant.request({
    db: app.dbName,
    path: '_local/' + req.params.key,
    method: 'POST',
    body: req.body
  }).pipe(res);
});

module.exports = router;
