var assert = require('assert'),
  auth = require('../lib/auth'),
  chance = require('chance')(),
  PouchDB = require('pouchdb');

describe('revsDiff', function () {
  it('single user', function () {
    this.timeout(10000);
    var docCount = 1,
      docs = testUtils.makeDocs(docCount),
      remoteURL = testUtils.url('bob', auth.sha1('bob')),
      remote = new PouchDB(remoteURL),
      fakeid = chance.guid(),
      fakerev = '1-f5cecfc5e2d5ea3e8b254e21d990fa7c';

    return remote.bulkDocs(docs).then(function (response) {
      var newDoc = testUtils.makeDocs(1)[0];
      newDoc._id = response[0].id;
      newDoc._rev = response[0].rev;
      return remote.put(newDoc);
    }).then(function (response) {
      var payload = {};
      payload[fakeid] = [fakerev];
      payload[response.id] = [response.rev];
      return remote.revsDiff(payload);
    }).then(function (response) {

      // id present
      assert(response[fakeid]);

      // single id
      assert.equal(Object.keys(response).length, 1,
        'Revsdiff listing should have a single entry');

      // rev present
      assert.equal(response[fakeid].missing.indexOf(fakerev), 0,
        'Revision should be present');

      // single revision
      assert.equal(response[fakeid].missing.length, 1,
        'Single revision');
    });
  });

  it('multiple users', function () {
    this.timeout(10000);
    var docCount = 1,
      docs = testUtils.makeDocs(docCount),
      docs2 = testUtils.makeDocs(docCount),
      remote = new PouchDB(testUtils.url('bob', auth.sha1('bob'))),
      remote2 = new PouchDB(testUtils.url('frank', auth.sha1('frank'))),
      fakeid = chance.guid(),
      fakerev = '1-45cecfc5e2d5ea3e8b254f21d990fa7a';

    return remote2.bulkDocs(docs2).then(function (response) {
      return remote.bulkDocs(docs);
    }).then(function (response) {
      var newDoc = testUtils.makeDocs(1)[0];
      newDoc._id = response[0].id;
      newDoc._rev = response[0].rev;
      return remote.put(newDoc);
    }).then(function (response) {
      var payload = {};
      payload[fakeid] = [fakerev];
      payload[response.id] = [response.rev];
      return remote.revsDiff(payload);
    }).then(function (response) {

      // id present
      assert(response[fakeid]);

      // single id
      assert.equal(Object.keys(response).length, 1,
        'Revsdiff listing should have a single entry');

      // rev present
      assert.equal(response[fakeid].missing.indexOf(fakerev), 0,
        'Revision should be present');

      // single revision
      assert.equal(response[fakeid].missing.length, 1,
        'Single revision');
    });
  });
});
