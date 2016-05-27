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
var authenticator = passport.authenticate('basic', { session: true });


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
   done(null, id);
});


// authentication status
router.get('/_auth',  function(req, res, next) {
  if (req.session.passport && req.session.passport.user) {
    var obj = {
      loggedin: true,
      username: req.session.passport.user.username,
      displayName: req.session.passport.user.username       
    }
    res.send(obj);
  } else {
    res.status(403).send({ loggedin: false, path: null});
  }
});

// our middleware that injects the username into 'req'
var isAuthenticated = function() { 
  return function (req, res, next) {
    authenticator(req, res, function() {
      req.username=req.session.passport.user.username;
      next();
    });
  }
};

module.exports = {
  isAuthenticated: isAuthenticated,
  router: router
};


