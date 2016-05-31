'use strict';

// check for mandatory env variables
var mandatory = ['FACEBOOK_APP_ID','FACEBOOK_APP_SECRET','ENVOY_URL'];
for (var i in mandatory) {
  if (!process.env[mandatory[i]]) {
    throw('Facebook auth strategy requires env variable - ' + mandatory[i]);
  }
}

var FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
var FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
var AUTH_STUB = '/_auth/facebook';
var CALLBACK_PATH = AUTH_STUB + '/callback';
var FAIL_PATH = AUTH_STUB + '/fail';
var CALLBACK_URL = process.env.ENVOY_URL + CALLBACK_PATH;


var passport = require('passport'),
  url = require('url'),
  utils = require('../utils'),
  express = require('express'),
	router = express.Router(),
  FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
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
router.get(AUTH_STUB, passport.authenticate('facebook'));

// success callback
router.get(CALLBACK_PATH, 
           passport.authenticate('facebook'),
           function(req, res) {
             res.redirect('/');
           }
);


// authentication fail point
router.get(FAIL_PATH,  function(req, res, next) {
  res.send('Auth fail')
});

var isAuthenticated = function() { 
  return function (req, res, next) {
        
    if (req.session.passport && 
        req.session.passport.user && 
        req.session.passport.user.id) {

      // store the user identifier in the request
      req.user = {
        username: req.session.passport.user.id,
        displayName: req.session.passport.user.name
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




