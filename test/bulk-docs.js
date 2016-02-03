var assert = require('assert'),
  auth = require('../lib/auth'),
  _ = require('underscore'),
  PouchDB = require('pouchdb'),
  chance = require('chance')();

describe('bulk_docs', function () {
  it('bulk_docs with server assigned ids', function () {
    this.timeout(10000);
    var docCount = 5;
    var docs = testUtils.makeDocs(docCount),
      remoteURL = testUtils.url('bob', auth.sha1('bob')),
      remote = new PouchDB(remoteURL);

    return remote.bulkDocs(docs).then(function (response) {
      assert.equal(response.length, docCount, response);
      _.each(response, function (row) {
        assert.equal(_.has(row, 'error'), false);
      });

      // ensure we can retrieve what we inserted
      return remote.get(response[0].id);
    }).then(function (doc) {
      assert(doc._id);
    });
  });

  it('bulk_docs with user assigned ids', function () {
    this.timeout(10000);
    var docCount = 2;
    var docs = testUtils.makeDocs(docCount),
      remoteURL = testUtils.url('bob', auth.sha1('bob')),
      remote = new PouchDB(remoteURL);

    docs[0]._id = chance.guid();
    docs[1]._id = chance.guid();

    return remote.bulkDocs(docs).then(function (response) {
      assert.equal(response.length, docCount, response);
      _.each(response, function (row) {
        assert.equal(_.has(row, 'error'), false);
      });

      // ensure we can retrieve what we inserted
      return remote.get(docs[0]._id);
    }).then(function (doc) {
      assert(doc._id);
    });
  });

  it('bulk_docs with both user and server assigned ids', function () {
    this.timeout(10000);
    var docCount = 2;
    var docs = testUtils.makeDocs(docCount),
      remoteURL = testUtils.url('bob', auth.sha1('bob')),
      remote = new PouchDB(remoteURL);

    docs[0]._id = chance.guid();

    return remote.bulkDocs(docs).then(function (response) {
      assert.equal(response.length, docCount, response);
      _.each(response, function (row) {
        assert.equal(_.has(row, 'error'), false);
      });
    });
  });

  it('bulk_docs with some docs failing auth', function () {
    this.timeout(10000);
    var docCount = 2;
    var docs = testUtils.makeDocs(docCount),
      docs2 = testUtils.makeDocs(docCount),
      remoteURL = testUtils.url('bob', auth.sha1('bob')),
      remote = new PouchDB(remoteURL),
      remoteURL2 = testUtils.url('frank', auth.sha1('frank')),
      remote2 = new PouchDB(remoteURL2);

    return remote.bulkDocs(docs).then(function (response) {
      docs2[0]._id = response[0].id;
      docs2[0]._rev = response[0].rev;
      return remote2.bulkDocs(docs2).then(function (response) {
        _.each(response, function (row) {
          if (row.id === docs2[0]._id) {
            assert.equal(_.has(row, 'error'), true);
          } else {
            assert.equal(_.has(row, 'error'), false);
          }
        });
      });
    });
  });
});
