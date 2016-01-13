var express = require('express');
var router = express.Router();

var app = require('../../app');
var basicAuth = require('basic-auth');
var _ = require('underscore');
var request = require('request');

var utils = require('../utils');
var auth = require('../auth');

// helper function to call changes feed with _doc_ids filter
function filteredChanges(ids, seq, fn) {
    var url = app.db.config.url +
        '/' +
        app.dbName +
        '/_changes?filter=_doc_ids';
    var requestBody = {'doc_ids': ids};
    var queryOptions = {'filter':'_doc_ids'};
    if (seq) {
        queryOptions.since = seq;
    }
    request(
        {
            url: url,
            qs: queryOptions,
            method: 'POST',
            json: requestBody
        },
        function (error, response, body) {
            if (error) {
                fn(error, null);
            } else {
                fn(null, body);
            }
        }
    );
}

// _changes
//
// Get all owned docs from the users view, and pass this to the CouchDB _changes
// end point with the 'doc_ids' filter. Note: this doesn't work for Cloudant pre
// dbnext, but is supported on CouchDB v1.6.X+
router.get('/_changes', auth.isAuthenticated, function(req, res) {
    var user = basicAuth(req);

    app.db.view('auth', 'userdocs', {key: user.name}, function(err, body) {
        if (err){
            console.log(err);
            res.sendStatus(err.statusCode).send({
                error: err.error,
                reason: err.reason
            });
        } else {
            var ids = _.map(body.rows, function(row) {return row.id;});
            var seq; // comes from request, optional
            if (req.query.since) {
                seq = req.query.since;
            }
            filteredChanges(ids, seq, function(err, body) {
                if (err) {
                    res.sendStatus(err.statusCode).send({
                        error: err.error,
                        reason: err.reason
                    });
                } else {
                    res.json(body);
                }
            });
        }
    });
});

module.exports = router;
