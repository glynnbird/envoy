'use strict';
/* globals testUtils */

var PouchDB = require('pouchdb'),
  assert = require('assert'),
  auth = require('../lib/auth');

// Generate a bunch of documents, and store those in a local
// PouchDB. Kick off a push replication, and then query remote
// end to ensure that all generated documents made it acrosss.
describe('test single user sync', function () {
  var dbs = {};
  beforeEach(function (done) {
    dbs = {local: 'testdb', secondary: 'testdb2'};
    testUtils.cleanup([dbs.local, dbs.secondary], done);
  });

  afterEach(function (done) {
    testUtils.cleanup([dbs.local, dbs.secondary], done);
  });

  it('push replication', function () {
    this.timeout(10000);

    var username = 'push_repl_test';
    var remoteURL = testUtils.url(username, auth.sha1(username));

    var local = new PouchDB(dbs.local);
    var remote = new PouchDB(remoteURL);
    var docs = testUtils.makeDocs(5);

    return remote.allDocs()
      .then(function (response) {
        assert.equal(response.total_rows, 0);

        return local.bulkDocs(docs);
      }).then(function () {
        return local.replicate.to(remote);
      }).then(function () {
        // Verify that all documents reported as pushed are present
        // on the remote side.
        return remote.allDocs();
      }).then(function (response) {
        assert.equal(response.total_rows, docs.length);
      });
  });

  it('pull replication', function () {
    this.timeout(10000);

    var username = 'pull_repl_test';
    var remoteURL = testUtils.url(username, auth.sha1(username));

    var local = new PouchDB(dbs.local);
    var remote = new PouchDB(remoteURL);
    var docs = testUtils.makeDocs(5);

    return remote.bulkDocs(docs)
      .then(function () {
        return local.replicate.from(remote);
      }).then(function () {
        return local.allDocs();
      }).then(function (response) {
        assert.equal(response.total_rows, docs.length);
      });
  });

  it.skip('multi-client replication', function () {
    this.timeout(10000);

    var username = 'multi_repl_test';
    var remoteURL = testUtils.url(username, auth.sha1(username));

    var client1 = new PouchDB(dbs.local);
    var client2 = new PouchDB(dbs.secondary);
    var remote = new PouchDB(remoteURL);
    var docs = testUtils.makeDocs(5);

    return client1.bulkDocs(docs)
      .then(function () {
        return client1.replicate.to(remote);
      }).then(function () {
        return client2.replicate.from(remote);
      }).then(function () {
        return client2.allDocs();
      }).then(function (response) {
        assert.equal(response.total_rows, docs.length);
      });
  });
});
