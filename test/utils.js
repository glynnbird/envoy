'use strict';

var chance = require('chance')(),
  url = require('url'),
  PouchDB = require('pouchdb'),
  env = require('../lib/env.js');

var testUtils = {};
var userCount = 0;

// Delete specified databases
testUtils.cleanup = function (dbs, done) {
  env.getCredentials();

  var num = dbs.length;

  var finished = function() {
    if (--num === 0) {
      done();
    }
  };

  dbs.forEach(function(db) {
    new PouchDB(db).destroy(finished, finished);
  });
};

testUtils.url = function(user, password) {
  var e = env.getCredentials();
  return url.format({
    protocol: 'http',
    auth: user + ':' + password,
    host: e.url,
    pathname: 'mbaas'
  });
};

testUtils.uniqueUserUrl = function() {
  var username = 'user' + userCount++;
  return testUtils.url(username, require('../lib/utils').sha1(username));
};


testUtils.makeDocs = function(count) {
  var docs = [];
  for (var i=0; i<count; i++) {
    docs.push({
      jobid: chance.guid(),
      description: chance.paragraph({sentences: 2}),
      client: {
        firstname: chance.first(),
        lastname: chance.last(),
        address: chance.address(),
        city: chance.city(),
        state: chance.state({full: true}),
        phone: chance.phone(),
        zip: chance.zip(),
        email: chance.email()
      },
      i: i
    });
  }

  return docs;
};

testUtils.makeDocName = function() {
  return 'test_doc_' + new Date().getTime();
};

testUtils.d = function (msg, obj) {
  console.log(msg, JSON.stringify(obj, null, 2));
};

module.exports = testUtils;
