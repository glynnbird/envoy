'use strict';

var basicAuth = require('basic-auth'),
  crypto = require('crypto');

function unauthorized(res) {
  res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
  return res.sendStatus(401);
}

// Authenticator - shared middleware
function auth(req, res, next) {
  var user = basicAuth(req);
  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }
  // TODO: Call into for realz auth here: this is OBVIOUSLY not real.
  if (user.pass === sha1(user.name)) {
    return next();
  }

  return unauthorized(res);
}

function sha1(string) {
  return crypto.createHash('sha1').update(string).digest('hex');
}

module.exports = {
  isAuthenticated: auth,
  unauthorized: unauthorized,
  sha1: sha1
};
