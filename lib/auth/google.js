'use strict';

// check for mandatory env variables
var mandatory = ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','ENVOY_URL'];
for (var i in mandatory) {
  if (!process.env[mandatory[i]]) {
    throw('Google auth strategy requires env variable - ' + mandatory[i]);
  }
}

var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
var AUTH_STUB = '/_auth/google';
var CALLBACK_PATH = AUTH_STUB + '/callback';
var FAIL_PATH = AUTH_STUB + '/fail';
var CALLBACK_URL = process.env.ENVOY_URL + CALLBACK_PATH;


var passport = require('passport'),
  url = require('url'),
  utils = require('../utils'),
  express = require('express'),
	router = express.Router(),
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: 'https://www.googleapis.com/auth/plus.login'
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
router.get(AUTH_STUB, passport.authenticate('google'));

// success callback
router.get(CALLBACK_PATH, 
           passport.authenticate('google'),
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
        displayName: req.session.passport.user.displayName
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




