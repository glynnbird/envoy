'use strict';
/* globals testUtils */

var assert = require('assert'),
  auth = require('../lib/auth'),
  PouchDB = require('pouchdb'),
  app = require('../app'),
  remoteURL = testUtils.uniqueUserUrl(),
  remote = new PouchDB(remoteURL);



describe('query', function () {
  
  before(function(done) {
    var docs = testUtils.makeDocs(20);
    remote.bulkDocs(docs, function (response) {
      done(); 
    });
  });
  
  it('select records without an index', function (done) {
    // Cloudant "/db/_find"
    var r = { 
      url: '_find', 
      method: 'post', 
      body: { 
        selector: { 
          i: { $gt: 5}
        }
      }
    };
    remote.request(r, function (err, response) {
      assert(err == null);
      assert(typeof response.warning === 'string');
      assert(response.docs.length > 1);
      response.docs.forEach(function (doc) {
        
        // check that our query worked (docs with i > 5)
        assert(doc.i > 5);
        
        // ensure we have stripped auth information
        assert(typeof doc[app.metaKey] == 'undefined');
      });
      done();
    });
  });
  
  it('create json index', function(done) {
    // Cloudant "/db/_index" 
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
    remote.request(r, function(err, response) {
      assert(err == null);
      assert(response.result === 'created');
      assert(typeof response.id === 'string');
      assert(response.name === 'testjsonindex');
      done()
    });
      
  })
  
  
  it('read from json index', function (done) {
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
    remote.request(r, function (err, response) {
      assert(err == null);
      assert(typeof response.warning != 'string')
      assert(response.docs.length > 1);
      response.docs.forEach(function (doc) {
        // check that our query worked (docs with i > 5)
        assert(doc.i > 5);
        
        // ensure we have stripped auth information
        assert(typeof doc[app.metaKey] == 'undefined');
      });
      done();
    });
  });
  
  
  it('create text index', function (done) {
    // Cloudant "/db/_find"
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
    remote.request(r, function(err, response) {  
      assert(err == null);    
      assert(response.result === 'created');
      assert(typeof response.id === 'string');
      assert(response.name === 'testtextindex');
      done();
    });
    
  });
  
  it('read from text index', function (done) {  
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
    remote.request(r, function (err, response) {
      assert(err == null);
      assert(typeof response.warning != 'string')
      assert(response.docs.length > 1);
      response.docs.forEach(function (doc) {
        // check that our query worked (docs with i > 5)
        assert(doc.i > 5);
        
        // ensure we have stripped auth information
        assert(typeof doc[app.metaKey] == 'undefined');
      });
      done();
    });
  });
  
});
