'use strict';

var express = require('express'),
  router = express.Router(),
  utils = require('../utils'),
  auth = require('../auth');


// Authenticated request to /db/_index
// This creates a Cloudant Query index 
// see https://docs.cloudant.com/cloudant_query.html#creating-an-index
// The index is modified to add the user name into the index too.
/*

**** Removed for now - see issue #31 ****

router.post('/:db/_index', auth, function(req, res) {
  
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
*/

// don't allow the creation of indexes via Envoy API
router.post('/:db/_index', auth.isAuthenticated(), function(req, res) { 
  var err = {
    statusCode: 404,
    error: 'Not Found',
    reason: 'Not supported in Envoy'
  };
  return utils.sendError(err, res);
});

module.exports = router;
