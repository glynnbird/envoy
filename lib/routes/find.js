'use strict';

var express = require('express'),
  router = express.Router(),
  basicAuth = require('basic-auth'),
  app = require('../../app'),
  utils = require('../utils'),
  auth = require('../auth');

// Authenticated request to /db/_find
// The user posts their query to /db/_find.
// We modify their query so that it only
// includes their documents.
router.post('/:db/_find', auth.isAuthenticated, function(req, res) {
  
  // Authenticate the documents requested
  var user = basicAuth(req);
  var body = req.body;
  
  // ensure that the query contains no reference to our meta object
  if (JSON.stringify(body).indexOf(app.metaKey) > -1) {
    var err = { 
      statusCode: 400, 
      error: 'Bad Request', 
      reason: 'Invalid query'};
    return utils.sendError(err, res);
  }
  
  // merge the user-supplied query with a search for this user's docs
  if (body && body.selector) {
    var filter = { 
      $and: [
        { 
          // clause to filter by user id goes here
        },
        body.selector
      ]
    };
    filter.$and[0][app.metaKey + '.auth.users'] = {
      $elemMatch: {
        $eq: user.name
      }
    };
    body.selector = filter;
  }

  app.db.find(body)
    .pipe(utils.liner())
    .pipe(utils.authRemover())
    .pipe(res);

});

module.exports = router;
