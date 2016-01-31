var PouchDB = require('pouchdb');
var assert = require('assert');
var _ = require('underscore');
var auth = require('../lib/auth');

// Generate a bunch of documents, and store those in a local
// PouchDB. Kick off a push replication, and then query remote
// end to ensure that all generated documents made it acrosss.
describe('test single user sync', function () {
  var dbs = {};
  beforeEach(function (done) {
    dbs = {local: 'testdb'};
    testUtils.cleanup([dbs.local], done);
  });

  afterEach(function (done) {
    testUtils.cleanup([dbs.local], done);
  });

  it('push replication', function () {
    this.timeout(10000);

    var username = 'push_repl_test';
    var remoteURL = testUtils.url(username, auth.sha1(username));

    var local = new PouchDB(dbs.local);
    var remote = new PouchDB(remoteURL);
    var docs = testUtils.makeDocs(5);

    return remote.allDocs().then(function(response) {
      /*jshint camelcase: false */
      assert.equal(response.total_rows, 0);

      local.bulkDocs(docs).then(function (response) {
        local.replicate.to(remote)
          .on('complete', function (info) {
            // Verify that all documents reported as pushed are present
            // on the remote side.
            remote.allDocs().then(function(response) {
              assert.equal(response.total_rows, docs.length, response);
            });
          });
      });
    });
  });
});
