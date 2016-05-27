'use strict';
/* globals testUtils */

var assert = require('assert'),
  utils = require('../lib/utils'),
  PouchDB = require('pouchdb');

describe('bulk_get', function () {
  it('bulk_get_1', function () {
    this.timeout(10000);
    var docCount = 5;
    var docs = testUtils.makeDocs(docCount),
      remoteURL = testUtils.url('bob', utils.sha1('bob')),
      remote = new PouchDB(remoteURL);

    return remote.bulkDocs(docs).then(function (response) {
      return remote.bulkGet({docs: response});
    }).then(function (response) {
      response.results.forEach(function (row) {
        var doc = row.docs[0];
        assert(doc.ok && doc.ok._id && doc.ok._id && doc.ok._rev);
      });
    });
  });
});
