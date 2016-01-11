'use strict';
var express = require('express');
var basicAuth = require('basic-auth');
var Cloudant = require('cloudant');
var creds = require('./creds.json');
var bodyParser = require('body-parser');
var _ = require('underscore');


var app = express();
app.use(bodyParser());

var cloudant = new Cloudant(creds);

// Authenticator
function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
}

var auth = function (req, res, next) {
  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }
  // Call into for realz auth here
  if (user.name === 'foo' && user.pass === 'bar') {
    return next();
  } else {
    return unauthorized(res);
  }
};

// Demo function, not something to keep for a long time...
app.get('/', function(req, res) {
    res.header('Content-Type', 'text/html');
    res.write('<li><a href="/c3065e59c9fa54cc81b5623fa0610544">doc1</a></li>');
    res.write('<li><a href="/c3065e59c9fa54cc81b5623fa06902f0">doc2</a></li>');
    res.end();
});

var db = cloudant.db.use('mbaas');

var stripAndSendJSON = function(data, res){
    // 1. remove the authentication metadata
    // 2. return the remaining JSON
    // Should we strip the _rev, too?
    delete data['com.cloudant.meta'];
    res.json(data);
};

// helper method to write a json object to cloudant
var writeDoc = function(db, data, req, res) {
    db.insert(data, req.params.id, function(err, body) {
        if (err) {
            console.log(err);
            res.status(err.statusCode).send({error: err.error, reason: err.reason});
        } else {
            res.json(body);
        }
    });
}

// _bulk_docs

app.post('/_bulk_docs', auth, function(req, res) {

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
                var auth = row.doc['com.cloudant.meta'].auth;
                return (auth.users.indexOf(user.name) >= 0);
            } 
        }).map(function(row) {
            var newDoc = docsById[row.doc._id];
            var auth = row.doc['com.cloudant.meta'].auth;
            // overwrite the auth from the previous doc
            newDoc["com.cloudant.meta"] = {"auth": auth};
            return newDoc;
        });

        console.log("GOOD DOCS:"+JSON.stringify(goodDocs));
    
        var badDocs = _.filter(body.rows, function(row) {
            // docs that exist but don't have correct auth
            if (row.doc) {
                var auth = row.doc['com.cloudant.meta'].auth;
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


app.get('/:id', auth, function(req, res) {
    // 1. Get the document from the db
    // 2. Validate that the user has access
    // 3. return the document with the auth information stripped out
    db.get(req.params.id, function(err, data) {

        if (err){
            console.log(err);
            // Propagate the error
            res.status(err.statusCode).send({error: err.error, reason: err.reason});
        } else {
            console.log(data['com.cloudant.meta']);
            var user = basicAuth(req);
            var auth = data['com.cloudant.meta'].auth;
            if (auth.users.indexOf(user.name) >= 0) {
                stripAndSendJSON(data, res);
            } else {
                return unauthorized(res);
            }
        }
    });
});

// Update a document
app.post('/:id', auth, function(req, res) {

    // 1. Get the document from the db
    // 2. Validate that the user has access
    // 3. Write the doc with the auth information added back in, return the database response
    
    console.log(req.body);

    db.get(req.params.id, function(err, data) {
        console.log(data['com.cloudant.meta']);

        if (err) {
            console.log(err);
            res.status(err.statusCode).send({error: err.error, reason: err.reason});
        } else {
            var user = basicAuth(req);
            var auth = data['com.cloudant.meta'].auth;
            if (auth.users.indexOf(user.name) >= 0) {
                var doc = req.body;
                doc['com.cloudant.meta'] = {"auth": auth};
                // TODO - should we require the user to send the current _rev
                // also need to propagate 409 correctly
                //doc['_rev'] = data['_rev'];
                writeDoc(db, doc, req, res);
            } else {
                return unauthorized(res);
            }
        }
    });
});

// Insert a document
app.put('/:id', auth, function(req, res) {

    // 1. Read the new doc
    // 2. Add auth information, user has access
    // 3. Write the doc, return the database response

    console.log(req.body);

    var doc = req.body;
    var user = basicAuth(req);
    doc['com.cloudant.meta'] = {'auth': {'users':[user.name]}};

    writeDoc(db, doc, req, res);    
});

// Delete a document
app.delete('/:id', auth, function(req, res) {

    db.get(req.params.id, req.query._rev, function(err, data) {
        console.log(data['com.cloudant.meta']);
        
        if (err){
            console.log(err);
            // TODO doc not found?
        };
        
        var user = basicAuth(req);
        var auth = data['com.cloudant.meta'].auth;
        if (auth.users.indexOf(user.name) >= 0) {
            db.destroy(req.params.id, req.query._rev, function(err, data) {
                stripAndSendJSON(data, res);
            });
        } else {
            return unauthorized(res);
        }
    });

});


// TODO: API endpoint for setting permissions on a doc

app.listen(process.env.PORT || 8080);
