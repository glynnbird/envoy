'use strict';

var basicAuth = require('basic-auth');

// for now we store the list of user names and password in an associative hash
var usersHash = {'foo':'bar',
                 'alice':'baz',
                 'bob':'secret'};

// Authenticator - shared middleware

function unauthorized(res) {
  res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
  return res.send(401);
}

function auth(req, res, next) {
  var user = basicAuth(req);
  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }
  // TODO: Call into for realz auth here
  if (usersHash[user.name] != null && usersHash[user.name] == user.pass) {
    return next();
  } else {
    return unauthorized(res);
  }
}

exports.isAuthenticated = auth;
exports.unauthorized = unauthorized;
