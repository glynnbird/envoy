'use strict';

var express = require('express'),
  router = express.Router(),
  basicAuth = require('basic-auth'),
  app = require('../../app'),
  utils = require('../utils'),
  auth = require('../auth');


// Authenticated request to /db/_index
// This creates a Cloudant Query index 
// see https://docs.cloudant.com/cloudant_query.html#creating-an-index
// The index is modified to add the user name into the index too.
router.post('/:db/_index', auth.isAuthenticated, function(req, res) {
  
  // Authenticate the documents requested
  var user = basicAuth(req);
  
  // extract the body
  var body = req.body;
  if (body && utils.isArray(body.index.fields) && 
      body.index.fields.length > 0) {
    var first = body.index.fields[0];
    var toindex = app.metaKey + '.auth.users.[]';
    if (utils.isObject(first)) {
      body.index.fields.unshift({ name: toindex, type: 'string'});
    } else if (utils.isString(first)) {
      body.index.fields.unshift(toindex);
    }
  }
  
  app.db.index(body, function (err, body) {
    if (err) {
      return utils.sendError(err, res);
    }
    res.json(body);
  });

});

module.exports = router;
