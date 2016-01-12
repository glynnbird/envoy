var express = require('express');
var router = express.Router();

var app = require('../../app');

var basicAuth = require('basic-auth');
var _ = require('underscore');

var utils = require('../utils');
var auth = require('../auth');

// _bulk_docs

router.post('/_bulk_docs', auth.isAuthenticated, function(req, res) {

    // TODO - support new_edits=false case correctly
    // (this is important for the replicator to work)

    // iterate through docs

    var ids = {"keys": _.map(req.body.docs, function(doc) {
        return doc._id;
    })};

    // for now we don't care about _rev in this hash but we will do later...
    var docsById = _.reduce(req.body.docs, function(hash, doc) {
        hash[doc._id] = doc;
        return hash;
    }, {});

    // TODO - although we ask for conflicts, we don't handle them yet.

    // for each doc check we have permissions correct
    // if true, upload doc
    // otherwise error

    db.fetch(ids, {"conflicts": true}, function(err, body) {
        var user = basicAuth(req);
        var goodDocs = _.filter(body.rows, function(row) {
            if (row.doc) {
                var auth = row.doc[app.metaKey].auth;
                return (auth.users.indexOf(user.name) >= 0);
            }
        }).map(function(row) {
            var newDoc = docsById[row.doc._id];
            var auth = row.doc[app.metaKey].auth;
            // overwrite the auth from the previous doc
            newDoc[app.metaKey] = {"auth": auth};
            return newDoc;
        });

        console.log("GOOD DOCS:"+JSON.stringify(goodDocs));

        var badDocs = _.filter(body.rows, function(row) {
            // docs that exist but don't have correct auth
            if (row.doc) {
                var auth = row.doc[app.metaKey].auth;
                return !(auth.users.indexOf(user.name) >= 0);
            } else {
                return false;
            }
        });

        console.log("BAD DOCS:"+JSON.stringify(badDocs));

        // TODO deal with bad docs and tell the user (or replicator?)

        db.bulk({"docs": goodDocs}, function(err, body) {
            if (err) {
                console.log(err);
            } else {
                res.json(body);
            }
        });
    });
});

module.exports = router;
