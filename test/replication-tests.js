var utils = require('../lib/utils'),
  app = require('../app'),
  assert = require('assert'),
  auth = require('../lib/auth'),
  request = require('supertest'),
  urllib = require('url'),
  async = require('async'),
  _ = require('underscore'),
  PouchDB = require('pouchdb'),
  chance = require('chance')(),
  fs = require('fs');

// Required environment variables
var port = parseInt(process.env.PORT || '8080', 10),
  username = 'foo',
  password = auth.sha1(username);

function url(user, password) {
  return urllib.format({
    protocol: 'http',
    auth: user + ':' + password,
    hostname: 'localhost',
    port: port,
    pathname: 'mbaas'
  });
}

function removeDB(dbname) {
  if (fs.existsSync(dbname)) {
    fs.readdirSync(dbname).forEach(function (filename, index) {
      var path = dbname + '/' + filename;
      fs.unlinkSync(path);
    });
    fs.rmdirSync(dbname);
  }
}

function makeDocs(count) {
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
      }
    });
  }

  return docs;
}

// Generate a bunch of documents, and store those in a local
// PouchDB. Kick off a push replication, and then query remote
// end to ensure that all generated documents made it acrosss.
//
// NOTE Reading back writes. This will eventually fail.
describe('PouchDB push', function () {
  var dbname = 'test.db';

  removeDB(dbname);
  it('push replication', function (done) {
    this.timeout(150000);
    var localDB = new PouchDB('test.db');
    var serverURL = url(username, password);
    var keys = [];
    localDB.bulkDocs(makeDocs(5)).then(function (response) {
      localDB.replicate.to(serverURL).on('change', function (result) {
        _.each(result.docs, function (doc) {
          var key = {id: doc._id, rev: doc._rev};
          keys.push(key);
        });
      }).on('complete', function (info) {
        // Verify that all documents reported as pushed are present
        // on the remote side.
        async.map(keys, function (doc, callback) {
          request(serverURL).get('/' + doc.id)
            .expect(200)
            .end(function (err, res) {
              if (err) {
                callback(err, err);
              } else {
                callback(null, res);
              }
            });
        }, function (err, results) {
          done();
        });
      }).on('error', function (err) {
        console.error(err);
      });
    }).catch(function (err) {
      console.error(err);
    });
  });
});
