var util = require('util'),
  assert = require('assert'),
  request = require('supertest'),
  urllib = require('url'),
  async = require('async');

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
          assert(res.body[fakeid]);

          // single
          assert.equal(Object.keys(res.body).length, 1,
            'Revsdiff listing should have a single entry');

          // rev present
          assert.equal(res.body[fakeid].missing.indexOf(fakerev), 0,
            'Revision should be present');

          done();
        }
      );
    });
  });
});
