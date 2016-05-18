'use strict';

var express = require('express'),
  router = express.Router(),
  basicAuth = require('basic-auth'),
  app = require('../../app'),
  utils = require('../utils'),
  auth = require('../auth'),
  databaseName = process.env.MBAAS_DATABASE_NAME;

// Authenticated request to /db/_find
// The user posts their query to /db/_find.
// We modify their query so that it also only
// includes their documents.
router.post('/:db/_find', auth.isAuthenticated, function(req, res) {
  
  // Authenticate the documents requested
  var user = basicAuth(req);
  
  // merge the user-supplied query with a search for this user's docs
  var body = req.body;
  if (body && body.selector) {
    var filter = { 
      "$and": [
        { 
          // clause to filter by user id goes here
        },
        body.selector
      ]
    };
    filter["$and"][0][app.metaKey + '.auth.users'] = {
      "$elemMatch": {
        "$eq": user.name
      }
    }
    body.selector = filter;
  }
  
  app.db.find(body, function (err, body) {
    if (err) {
      return utils.sendError(err, res);
    }
    res.json(body);
  });

});

module.exports = router;
