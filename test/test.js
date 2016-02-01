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

var util = require('util'),
  app = require('../app'),
  auth = require('../lib/auth'),
  assert = require('assert'),
  request = require('supertest'),
  urllib = require('url'),
  async = require('async'),
  _ = require('underscore');

before(function(done) {
  this.timeout(15000);
  app.events.on('listening', function() {
    console.log('Server is up');
    done();
  });
});

var port = parseInt(process.env.PORT || '8080', 10),
  username = 'foo',
  password = auth.sha1(username),
  badPassword = 'baz';

function url(user, password) {
  return urllib.format({
    protocol: 'http',
    auth: user + ':' + password,
    hostname: 'localhost',
    port: port,
    pathname: 'mbaas'
  });
}

describe('CRUD tests', function() {

  // create doc successfully
  it('create doc successfully', function(done) {
    var path = '/' + makeDocName();
    var body = {'hello': 'world'};
    request(url(username, password)).put(path)
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
    var path = '/' + makeDocName();
    var body = {'hello': 'world'};
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

  it('update doc successfully, auth '+
  'medatada is inherited from parent doc', function(done) {

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
            assert(res.body._rev.startsWith('2-'));
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
            rev = res.body.rev;
            next();
          });
      },
      function(next) {
        // delete doc
        request(url(username, password)).del(path+'?rev='+rev)
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
            rev = res.body.rev;
            next();
          });
      },
      function(next) {
        // delete doc
        request(url(username, badPassword)).del(path+'?rev='+rev)
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

describe('Replication-related tests', function() {

  it('check _changes', function(done) {
    this.timeout(150000);

    async.waterfall([
      // Step 1: insert doc1: owned by foo
      function (callback) {
        request(url(username, password)).put('/' + makeDocName())
          .send({'hello': 'world'})
          .end(function(err, res) {
            callback(err, [res]); // args[0]
          });
      },

      function (args, callback) {
        // Step2: invoke _changes: doc1@rev1 seen. save sequence to seq1
        request(url(username, password)).get('/_changes')
          .end(function(err, res) {
            args.push(res);
            callback(err, args); // args[1]
          });
      },

      function (args, callback) {
        // Step 3: update doc1
        var path = '/' + args[0].body.id;
        request(url(username, password)).post(path)
          .send({'new': 'body'})
          .end(function(err, res) {
            args.push(res);
            callback(err, args); // args[2] <-- new rev
          });
      },

      function(args, callback) {
        // Step 4: invoke _changes: doc1@rev1, doc1@rev2 (args[2]) seen
        request(url(username, password)).get('/_changes')
          .end(function(err, res) {
            args.push(res);
            callback(err, args); // args[3]
          });
      },

      function(args, callback) {
        var row = _.findWhere(args[1].body.results, {id: args[0].body.id});
        if (row) {
          request(url(username, password)).get('/_changes?since='+row.seq)
            .end(function(err, res) {
              args.push(res);
              callback(err, args); // args[4]
            }
          );
        } else {
          callback(new Error('Failed to locate expected id in changes'), args);
        }
      }
    ],

    function (err, args) {
      if (err) {
        console.error(err);
        done();
        return;
      }

      // assert.ok(args[4].body.results.length === 1);
      var row = _.findWhere(args[4].body.results, {id: args[0].body.id});
      assert.ok(row);
      assert.ok(row.changes[0].rev === args[2].body.rev);

      done();
    }

  );});

  it('check _revs_diff', function(done) {
    this.timeout(150000);
    var urlstr = url(username, password);
    var path = '/' + makeDocName();

    async.series([
      function(callback) {
        request(urlstr).put(path)
          .send({'hello': 'world'})
          .end(function(err, res) {
            callback(err, res);
          });
      },

      function(callback) {
        request(urlstr).post(path)
          .send({'goodbye': 'world'})
          .end(function(err, res) {
            callback(err, res);
          });
      },
    ],

    function (err, results) {
      if (err) {
        console.error(err);
        done();
        return;
      }

      var body = {};
      var fakeid = makeDocName();
      var fakerev = '1-ff55aa6633bbddaa765';
      body[results[0].body.id] = [results[0].body.rev, results[1].body.rev];
      body[fakeid] = [fakerev];
      request(urlstr).post('/_revs_diff')
        .send(body)
        .end(function (err, res) {
          if (err) {
            console.error(err);
          }

          // We expect the result to have a single id: fakeid with a
          // single missing rev: fakerev.

          // id present
          assert.ok(_.has(res.body, fakeid));

          // single
          assert.ok(_.keys(res.body).length === 1);

          // rev present
          assert.ok(_.indexOf(res.body[fakeid].missing, fakerev) !== -1);

          // single
          assert.ok(res.body[fakeid].missing.length === 1);

          done();
        }
      );
    }
  );
});
});

function makeDocName() {
  var doc = 'test_doc_'+new Date().getTime();
  return doc;
}
