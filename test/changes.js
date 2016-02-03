var util = require('util');
var assert = require('assert');
var request = require('supertest');
var urllib = require('url');
var async = require('async');
var _ = require('underscore');

describe('test _changes', function() {

  it('test basics', function(done) {
    this.timeout(150000);

    var url = testUtils.url(username, password);

    async.waterfall([
      // Step 1: insert doc1: owned by foo
      function (callback) {
        request(url).put('/' + testUtils.makeDocName())
          .send({'hello': 'world'})
          .end(function(err, res) {
            callback(err, [res]); // args[0]
          });
      },

      function (args, callback) {
        // Step2: invoke _changes: doc1@rev1 seen. save sequence to seq1
        request(url).get('/_changes')
          .end(function(err, res) {
            args.push(res);
            callback(err, args); // args[1]
          });
      },

      function (args, callback) {
        // Step 3: update doc1
        var path = '/' + args[0].body.id;
        request(url).post(path)
          .send({'new': 'body'})
          .end(function(err, res) {
            args.push(res);
            callback(err, args); // args[2] <-- new rev
          });
      },

      function(args, callback) {
        // Step 4: invoke _changes: doc1@rev1, doc1@rev2 (args[2]) seen
        request(url).get('/_changes')
          .end(function(err, res) {
            args.push(res);
            callback(err, args); // args[3]
          });
      },

      function(args, callback) {
        var id = args[0].body.id;
        var row = _.findWhere(args[1].body.results, { 'id': id });
        if (row) {
          request(url).get('/_changes?since=' + row.seq)
            .end(function(err, res) {
              args.push(res);
              callback(err, args); // args[4]
            }
          );
        } else {
          callback(new Error('Failed to locate id ' + id +
            ' in changes: ' + JSON.stringify(args[1].body)), args);
        }
      }
    ],

    function (err, args) {
      if (err) {
        done(err);
      }

      // assert.ok(args[4].body.results.length === 1);
      var row = _.findWhere(args[4].body.results, {id: args[0].body.id});
      assert.ok(row);
      assert.ok(row.changes[0].rev === args[2].body.rev);

      done();
    });
  });
});