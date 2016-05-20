'use strict';
/* globals testUtils */

var assert = require('assert'),
  auth = require('../lib/auth'),
  PouchDB = require('pouchdb');

describe('query', function () {
  it('select records without an index', function () {
    this.timeout(10000);
    var docCount = 10;
    var docs = testUtils.makeDocs(docCount),
      remoteURL = testUtils.url('bob', auth.sha1('bob')),
      remote = new PouchDB(remoteURL);
      
    // Cloudant "/db/_find"
    return remote.bulkDocs(docs).then(function (response) {
      var r = { 
        url: '_find', 
        method: 'post', 
        body: { 
          selector: { 
            i: { $gt: 5}
          }
        }
      };
      return remote.request(r);
    }).then(function (response) {
      assert(typeof response.warning === 'string')
      response.docs.forEach(function (doc) {
        assert(doc.i > 5)
      });
    });
  });
  
  
  it('select records with a json index', function () {
    this.timeout(10000);
    var docCount = 10;
    var docs = testUtils.makeDocs(docCount),
      remoteURL = testUtils.url('bob', auth.sha1('bob')),
      remote = new PouchDB(remoteURL);
  
    // Cloudant "/db/_find"
    return remote.bulkDocs(docs).then(function (response) {
      
      // create json index
      var r = { 
        url: '_index', 
        method: 'post', 
        body: { 
          index: {
            fields: ['i']
          },
          name: 'testjsonindex',
          type: 'json'
        }
      };
      return remote.request(r);
    }).then(function(response) {
      assert(response.result === 'created');
      assert(typeof response.id === 'string');
      assert(response.name === 'testjsonindex');
      
      // perform search
      var r = { 
        url: '_find', 
        method: 'post', 
        body: { 
          selector: { 
            i: { $eq: 5}
          }
        }
      };
      return remote.request(r);
    }).then(function (response) {
      assert(typeof response.warning != 'string')
      
      response.docs.forEach(function (doc) {
        assert(doc.i === 5)
      });
      return null;
    }, function(e) {
      console.log("Error", e);
    })
  });
  
  it('select records with a text index', function () {
    this.timeout(10000);
    var docCount = 10;
    var docs = testUtils.makeDocs(docCount),
      remoteURL = testUtils.url('bob', auth.sha1('bob')),
      remote = new PouchDB(remoteURL);
  
    // Cloudant "/db/_find"
    return remote.bulkDocs(docs).then(function (response) {
      
      // create json index
      var r = { 
        url: '_index', 
        method: 'post', 
        body: { 
          index: {
            fields: [{name: 'i', type: 'number'}]
          },
          name: 'testtextindex',
          type: 'text'
        }
      };
      return remote.request(r);
    }).then(function(response) {      
      assert(response.result === 'created');
      assert(typeof response.id === 'string');
      assert(response.name === 'testtextindex');
      
      // perform search
      var r = { 
        url: '_find', 
        method: 'post', 
        body: { 
          selector: { 
            i: { $gt: 5}
          }
        }
      };
      return remote.request(r);
    }).then(function (response) {
      assert(typeof response.warning != 'string')
      
      response.docs.forEach(function (doc) {
        assert(doc.i > 5)
      });
      return null;
    }, function(e) {
      console.log("Error", e);
    })
  });
  
});
