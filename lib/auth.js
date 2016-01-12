'use strict';

var basicAuth = require('basic-auth');

var username = 'foo';
var password = 'bar';

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
    if (user.name === username  && user.pass === password) {
        return next();
    } else {
        return unauthorized(res);
    }
}

exports.isAuthenticated = auth;
exports.unauthorized = unauthorized;
