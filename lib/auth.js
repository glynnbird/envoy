'use strict';

var passport = require('passport'),
  utils = require('./utils'),
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

module.exports = passport.authenticate('basic', { session: false });


