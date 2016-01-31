var util = require('util');
var assert = require('assert');
var request = require('supertest');
var urllib = require('url');
var async = require('async');
var _ = require('underscore');

describe('test _revs_diff', function() {

  it('test basics', function(done) {
    this.timeout(150000);
    var urlstr = testUtils.url(username, password);
    var path = '/' + testUtils.makeDocName();

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
      var fakeid = testUtils.makeDocName();
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
    });
  });
});