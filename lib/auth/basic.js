'use strict';

// warning to remind people they are using non-production code
console.log('WARNING: This is for demo and test purposes only');

var passport = require('passport'),
  utils = require('../utils'),
  express = require('express'),
	router = express.Router(),
  BasicStrategy = require('passport-http').BasicStrategy;

passport.use(new BasicStrategy(
  function(username, password, done) {
    if (password === utils.sha1(username)) {
      return done(null, { username: username});
    } else {
      return done(null, false);
    }
  }
));

// the passport authenticator middleware
var authenticator = passport.authenticate('basic', { session: false });

// our middleware that injects the username into 'req'
var isAuthenticated = function() { 
  return function (req, res, next) {
    authenticator(req, res, function() {
      req.username="jimmy";
      console.log(req);
      console.log(req.username);
      next();
    });
  }
};

module.exports = {
  isAuthenticated: function() { return authenticator; },
  router: router
};


