var express = require('express');
var router = express.Router();

var basicAuth = require('basic-auth');
var app = require('../../app');
var utils = require('../utils');
var auth = require('../auth');

// Update a document
router.post('/:id', auth.isAuthenticated, function(req, res) {

    // 1. Get the document from the db
    // 2. Validate that the user has access
    // 3. Write the doc with the auth information added back in,
    //    return the database response
    app.db.get(req.params.id, function(err, data) {
        console.log(data[app.metaKey]);

        if (err) {
            console.log(err);
            res.status(err.statusCode).send({
                error: err.error,
                reason: err.reason
            });
        } else {
            var user = basicAuth(req);
            var auth = data[app.metaKey].auth;
            if (auth.users.indexOf(user.name) >= 0) {
                var doc = req.body;
                doc[app.metaKey] = {'auth': auth};
                // TODO - should we require the user to send the current _rev
                // also need to propagate 409 correctly
                //doc['_rev'] = data['_rev'];
                utils.writeDoc(app.db, doc, req, res);
            } else {
                return auth.unauthorized(res);
            }
        }
    });
});

module.exports = router;
