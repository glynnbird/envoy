'use strict';

/* globals testUtils */
/* globals username */
/* globals password */

var assert = require('assert'),
  request = require('supertest'),
  async = require('async');

describe('CRUD tests', function() {
  var badPassword = 'baz';

  // create doc successfully
  it('create doc successfully', function(done) {
    var path = '/' + testUtils.makeDocName();
    var body = {'hello': 'world'};
    request(testUtils.url(username, password)).put(path)
      .send(body)
      .end(function(err, res){
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
    var path = '/' + testUtils.makeDocName();
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
    request(testUtils.url(username, password)).put(path)
      .send(body)
      .end(function(err, res){
        if (err) {
          throw err;
        }
        assert.equal(res.statusCode, 200);
        done();
        // TODO read back doc directly from cloudant and check auth metadata
      });
  });

  it('create doc unsuccessfully, incorrect creds', function(done) {
    var path = '/' + testUtils.makeDocName();
    var body = {'hello': 'world'};
    request(testUtils.url(username, badPassword)).put(path)
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
    var path = '/' + testUtils.makeDocName();
    request(testUtils.url(username, badPassword)).get(path)
      .send()
      .end(function(err,res){
        if (err) {
          throw err;
        }
        assert.equal(res.statusCode, 401);
        done();
      });
  });

  it('update doc successfully, auth '+
  'metadata is inherited from parent doc', function(done) {

    var path = '/' + testUtils.makeDocName();
    var body1 = {'hello': 'world'};
    var body2 = {'goodbye': 'world'};

    async.series([
      function(next) {
        // create doc
        request(testUtils.url(username, password)).put(path)
          .send(body1)
          .end(function(err, res) {
            assert.equal(res.statusCode, 200);
            next();
          });
      },
      function(next) {
        // update doc
        request(testUtils.url(username, password))
          .post(path)
          .send(body2)
          .end(function(err, res) {
            assert.equal(res.statusCode, 200);
            next();
          });
      },
      function(next) {
        // check rev
        request(testUtils.url(username, password)).get(path)
          .send()
          .end(function(err, res){
            if (err) {
              throw err;
            }
            assert.equal(res.statusCode, 200);
            assert(res.body._rev.startsWith('2-'));
            next();
          });
      }
      // TODO read back doc directly from cloudant and check auth metadata
    ], done);
  });

  it('update doc unsuccessfully, incorrect creds', function(done) {

    var path = '/' + testUtils.makeDocName();
    var body1 = {'hello': 'world'};
    var body2 = {'goodbye': 'world'};

    async.series([
      function(next) {
        // create doc
        request(testUtils.url(username, password)).put(path)
          .send(body1)
          .end(function(err, res) {
            assert.equal(res.statusCode, 200);
            next();
          });
      },
      function(next) {
        // update doc
        request(testUtils.url(username, badPassword)).post(path)
          .send(body2)
          .end(function(err, res) {
            assert.equal(res.statusCode, 401);
            next();
          });
      }
    ], done);
  });

  it('delete doc successfully', function(done) {

    var path = '/' + testUtils.makeDocName();
    var body = {'hello': 'world'};
    var rev;

    async.series([
      function(next) {
        // create doc
        request(testUtils.url(username, password)).put(path)
          .send(body)
          .end(function(err, res) {
            assert.equal(res.statusCode, 200);
            // capture revision so we can delete
            rev = res.body.rev;
            next();
          });
      },
      function(next) {
        // delete doc
        request(testUtils.url(username, password))
          .del(path+'?rev='+rev)
          .send()
          .end(function(err, res) {
            assert.equal(res.statusCode, 200);
            next();
          });
      }
    ], done);
  });

  it('delete doc unsuccessfully, incorrect creds', function(done) {
    var path = '/' + testUtils.makeDocName();
    var body = {'hello': 'world'};
    var rev;

    async.series([
      function(next) {
        // create doc
        request(testUtils.url(username, password)).put(path)
          .send(body)
          .end(function(err, res) {
            assert.equal(res.statusCode, 200);
            // capture revision so we can delete
            rev = res.body.rev;
            next();
          });
      },
      function(next) {
        // delete doc
        request(testUtils.url(username, badPassword))
          .del(path+'?rev='+rev)
          .send()
          .end(function(err, res) {
            assert.equal(res.statusCode, 401);
            next();
          });
      }
    ], done);

  });

});
