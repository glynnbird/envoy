'use strict';

// check for mandatory env variables
var mandatory = ['GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET','ENVOY_URL'];
for (var i in mandatory) {
  if (!process.env[mandatory[i]]) {
    throw('Github auth strategy requires env variable - ' + mandatory[i]);
  }
}

var GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
var GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
var AUTH_STUB = '/_auth/github';
var CALLBACK_PATH = AUTH_STUB + '/callback';
var FAIL_PATH = AUTH_STUB + '/fail';
var CALLBACK_URL = process.env.ENVOY_URL + CALLBACK_PATH;


var passport = require('passport'),
  url = require('url'),
  utils = require('../utils'),
  express = require('express'),
	router = express.Router(),
  GitHubStrategy = require('passport-github2').Strategy;

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
    done(null, profile);
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
   done(null, id);
});

// authentication start point
router.get(AUTH_STUB, passport.authenticate('github'));

// success callback
router.get(CALLBACK_PATH, 
           passport.authenticate('github'),
           function(req, res) {
             res.redirect('/_auth');
           }
);

// authentication fail point
router.get(FAIL_PATH,  function(req, res, next) {
  res.send('Auth fail')
});

// authentication status
router.get('/_auth',  function(req, res, next) {
  if (req.session.passport && req.session.passport.user) {
    var obj = {
      loggedin: true,
      username: req.session.passport.user.id,
      displayName: req.session.passport.user.username    
    }
    res.send(obj);
  } else {
    res.status(403).send({ loggedin: false, path: AUTH_STUB});
  }
});

var isAuthenticated = function() { 
  return function (req, res, next) {    
    
    if (req.session.passport && 
        req.session.passport.user && 
        req.session.passport.user.id) {

      // store the user identifier in the request
      req.user = {
        username: req.session.passport.user.id,
        displayName: req.session.passport.user.username
      };
      
      // call the next thing in the chain
      next();
      
    } else {
      utils.unauthorized(res);
    }
  }
}
  
module.exports = {
  isAuthenticated: isAuthenticated,
  router: router
};




