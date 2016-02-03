var utils = require('../lib/utils'),
  app = require('../app'),
  assert = require('assert'),
  auth = require('../lib/auth'),
  urllib = require('url'),
  _ = require('underscore'),
  PouchDB = require('pouchdb'),
  chance = require('chance')();

// Required environment variables
var port = parseInt(process.env.PORT || '8080', 10);

function url(user, password) {
  return urllib.format({
    protocol: 'http',
    auth: user + ':' + password,
    hostname: 'localhost',
    port: port,
    pathname: 'mbaas'
  });
}

function makeDoc() {
  var doc = {
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
  };

  return doc;
}

function makeDocs(count) {
  var docs = [];
  for (var i=0; i<count; i++) {
    docs.push(makeDoc());
  }

  return docs;
}

describe('bulk_docs', function () {
  it('bulk_docs with server assigned ids', function () {
    this.timeout(10000);
    var docCount = 5;
    var docs = makeDocs(docCount),
      remoteURL = url('bob', auth.sha1('bob')),
      remote = new PouchDB(remoteURL);

    return remote.bulkDocs(docs).then(function (response) {
      assert.equal(response.length, docCount, response);
      _.each(response, function (row) {
        assert.equal(_.has(row, 'error'), false);
      });
    });
  });

  it('bulk_docs with user assigned ids', function () {
    this.timeout(10000);
    var docCount = 2;
    var docs = makeDocs(docCount),
      remoteURL = url('bob', auth.sha1('bob')),
      remote = new PouchDB(remoteURL);

    docs[0]._id = chance.guid();
    docs[1]._id = chance.guid();

    return remote.bulkDocs(docs).then(function (response) {
      assert.equal(response.length, docCount, response);
      _.each(response, function (row) {
        assert.equal(_.has(row, 'error'), false);
      });
    });
  });

  it('bulk_docs with both user and server assigned ids', function () {
    this.timeout(10000);
    var docCount = 2;
    var docs = makeDocs(docCount),
      remoteURL = url('bob', auth.sha1('bob')),
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
    var docs = makeDocs(docCount),
      docs2 = makeDocs(docCount),
      remoteURL = url('bob', auth.sha1('bob')),
      remote = new PouchDB(remoteURL),
      remoteURL2 = url('frank', auth.sha1('frank')),
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
