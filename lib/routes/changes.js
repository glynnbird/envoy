'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  basicAuth = require('basic-auth'),
  auth = require('../auth'),
  utils = require('../utils'),
  stream = require('stream');

// _changes
router.get('/:db/_changes', auth.isAuthenticated, function(req, res) {
  var user = basicAuth(req);
  var query = req.query || {};
  if (query.filter) {
    res.status(401).send({
      error: 'unauthorized',
      reason: 'Unauthorized.'
    });
    return;
  }

  // use Mango filtering https://github.com/apache/couchdb-couch/pull/162
  query.filter = '_selector';
  var selector = { 
                   selector: { 
                    'com_cloudant_meta.auth.users': { 
                       '$elemMatch' : { 
                         '$eq': user.name
                       }
                     }
                   }
                 };

  // query filtered changes               
  app.cloudant.request( {
    db: app.dbName,
    path: '_changes',
    qs: query,
    method: 'POST',
    body: selector
  }).pipe(utils.liner())
    .pipe(utils.authRemover())
    .pipe(res);

});

module.exports = router;
