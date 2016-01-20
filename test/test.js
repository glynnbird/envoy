//
// crud tests:
//

// create doc successfully
// create doc successfully, with auth metadata - ensure auth metadata gets
//  overwritten with new metadata
// create doc unsuccessfully, incorrect creds

// read doc successfully
// read doc unsuccessfully, incorrect creds

// update doc successfully, auth medatada is inherited from parent doc
// update doc successfully, with auth metadata - ensure auth metadata is
//  inherited from parent doc
// update doc unsuccessfully, incorrect creds

// delete doc successfully
// delete doc unsuccessfully, incorrect creds

//
// changes feed tests:
//

// preamble:

// insert doc1: owned by foo
// insert doc2: owned by bar
// insert doc3: owned by baz

// invoke _changes: doc1@rev1 seen. save sequence to seq1
// update doc1
// invoke _changes: doc1@rev1, doc1@rev2 seen
// invoke _changes with argument seq=seq1: doc1@rev2 seen
// update doc2 and doc3 to be owned by foo
// invoke _changes: doc1@rev1, doc1@rev2, doc2@rev1, doc3@rev1 seen
// update doc1 to be owned by baz
// invoke _changes: doc2@rev1, doc3@rev1 seen

//var www = require('../bin/www');
var app = require('../app');
var assert = require('assert');
var request = require('supertest');
var urllib = require('url');
var async = require('async');

before(function(done) {
  this.timeout(15000);
  app.events.on('listening', function() {
    console.log('Server is up');
    done();
  });
});

// Required environment variables
var port = parseInt(process.env.PORT || '8080', 10);

var username = 'foo';
var password = 'bar';
var badPassword = 'baz';

function url(user, password) {
  return urllib.format({
    protocol: 'http',
    auth: user + ':' + password,
    hostname: 'localhost',
    port: port
  });
}

describe('CRUD tests', function() {

  // create doc successfully
  it('create doc successfully', function(done) {
    var path = '/' + makeDocName();
    var body = {'hello': 'world'};
    request(url(username, password)).put(path)
      .send(body)
      .end(function(err,res){
        if (err) {
          throw err;
        }
        assert.equal(res.statusCode, 200);
        done();
        // TODO read back doc and check auth metadata
      });
  });

  // create doc successfully, with auth metadata - ensure auth metadata
  // gets overwritten with new metadata
  it('create doc successfully, with auth metadata', function(done) {
    var path = '/' + makeDocName();
    var body = {
      'hello':'world',
      'com.cloudant.meta': {
        'auth': {
          'users': [
            'bar',
            'baz'
          ]
        }
      }
    };
    request(url(username, password)).put(path)
      .send({'foo':'bar'})
      .end(function(err,res){
        if (err) {
          throw err;
        }
        assert.equal(res.statusCode, 200);
        done();
        // TODO read back doc directly from cloudant and check auth metadata
      });
  });

  it('create doc unsuccessfully, incorrect creds', function(done) {
    var path = '/' + makeDocName();
    var body = {'hello':'world'};
    request(url(username, badPassword)).put(path)
      .send(body)
      .end(function(err,res){
        if (err) {
          throw err;
        }
        assert.equal(res.statusCode, 401);
        done();
        // TODO read back doc directly from cloudant and check auth metadata
      });
  });

  it('read doc successfully', function(done) {
    // TODO - read doc that was created by a setup() block?
    done();
  });

  it('read doc unsuccessfully, incorrect creds', function(done) {
    var path = '/' + makeDocName();
    request(url(username, badPassword)).get(path)
      .send()
      .end(function(err,res){
        if (err) {
          throw err;
        }
        assert.equal(res.statusCode, 401);
        done();
      });
  });

  it('update doc successfully, auth medatada is inherited from parent doc', function(done) {

    var path = '/' + makeDocName();
    var body1 = {'hello': 'world'};
    var body2 = {'goodbye': 'world'};

    async.series([
      function(next) {
        // create doc
        request(url(username, password)).put(path)
          .send(body1)
          .end(function(err, res) {
            assert.equal(res.statusCode, 200);
            next();
          });
      },
      function(next) {
        // update doc
        request(url(username, password)).post(path)
          .send(body2)
          .end(function(err, res) {
            assert.equal(res.statusCode, 200);
            next();
          });
      },
      function(next) {
        // check rev
        request(url(username, password)).get(path)
          .send()
          .end(function(err, res){
            if (err) {
              throw err;
            }
            assert.equal(res.statusCode, 200);
            assert(res.body._rev.startsWith("2-"));
            next();
          });
      },
      function() {
        // all done
        done();
      }
      // TODO read back doc directly from cloudant and check auth metadata
    ]);
  });

  it('update doc unsuccessfully, incorrect creds', function(done) {

    var path = '/' + makeDocName();
    var body1 = {'hello': 'world'};
    var body2 = {'goodbye': 'world'};

    async.series([
      function(next) {
        // create doc
        request(url(username, password)).put(path)
          .send(body1)
          .end(function(err, res) {
            assert.equal(res.statusCode, 200);
            next();
          });
      },
      function(next) {
        // update doc
        request(url(username, badPassword)).post(path)
          .send(body2)
          .end(function(err, res) {
            assert.equal(res.statusCode, 401);
            next();
          });
      },
      function() {
        // all done
        done();
      }
    ]);
  });

  it('delete doc successfully', function(done) {

    var path = '/' + makeDocName();
    var body = {'hello': 'world'};
    var rev;

    async.series([
      function(next) {
        // create doc
        request(url(username, password)).put(path)
          .send(body)
          .end(function(err, res) {
            assert.equal(res.statusCode, 200);
            // capture revision so we can delete
            rev = res.body._rev;
            next();
          });
      },
      function(next) {
        // delete doc
        request(url(username, password)).del(path+"?_rev="+rev)
          .send()
          .end(function(err, res) {
            assert.equal(res.statusCode, 200);
            next();
          });
      },
      function() {
        // all done
        done();
      }
    ]);
  });
  
  it('delete doc unsuccessfully, incorrect creds', function(done) {
    var path = '/' + makeDocName();
    var body = {'hello': 'world'};

    async.series([
      function(next) {
        // create doc
        request(url(username, password)).put(path)
          .send(body)
          .end(function(err, res) {
            assert.equal(res.statusCode, 200);
            // capture revision so we can delete
            rev = res.body._rev;
            next();
          });
      },
      function(next) {
        // delete doc
        request(url(username, badPassword)).del(path+"?_rev="+rev)
          .send()
          .end(function(err, res) {
            assert.equal(res.statusCode, 401);
            next();
          });
      },
      function() {
        // all done
        done();
      }
    ]);

  });

});

function makeDocName() {
  var doc = 'test_doc_'+new Date().getTime();
  return doc;
  
}
