# Cloudant Envoy

_by: Stefan Kruger_

## Unsupported software

Note: this is a proof of concept; it's not battle tested or supported in any way. If you find bugs (of which there will be plenty), do let us know – or better, consider a pull request.

## Installation


### Deploy to Bluemix

The fastest way to deploy *Cloudant Envoy* to Bluemix is to click the **Deploy to Bluemix** button below.

[![Deploy to Bluemix](https://deployment-tracker.mybluemix.net/stats/34c200255dfd02ea539780bb433da951/button.svg)](https://bluemix.net/deploy?repository=https://github.com/cloudant-labs/envoy)

**Don't have a Bluemix account?** If you haven't already, you'll be prompted to sign up for a Bluemix account when you click the button.  Sign up, verify your email address, then return here and click the the **Deploy to Bluemix** button again. Your new credentials let you deploy to the platform and also to code online with Bluemix and Git. If you have questions about working in Bluemix, find answers in the [Bluemix Docs](https://www.ng.bluemix.net/docs/).

### Manual installation

Cloudant Envoy is a Node.js application on top of the Express.js framework. To install, clone the repo and run `npm install`. The Envoy server needs admin credentials for the backing Cloudant database, and it expects the following environment variables to be set:

```bash
export PORT=8001
export MBAAS_DATABASE_NAME='dbname'
export COUCH_HOST='https://key:passwd@account.cloudant.com'
```

After those variables are set, you can start the Envoy server with `npm start`. Note that the port is the port that Envoy will listen to, not the port of the Cloudant server.

### Environment variables

* PORT - the port number Envoy will listen on. When running in Bluemix, Envoy detects the Cloud Foundry port assigned to this app automatically. When running locally, you'll need to provide your own e.g. `export PORT=8001`
* COUCH_HOST - The URL of the Cloudant service to connected to. Not required in Bluemix, as the attached Cloudant service is detected automatically. `COUCH_HOST` is required when running locally e.g. `export COUCH_HOST='https://key:passwd@account.cloudant.com'`
* MBAAS_DATABASE_NAME - the name of the Cloudant database to use. Defaults to `mbaas`
* LOG_FORMAT - the type of logging to output. One of `combined`, `common`, `dev`, `short`, `tiny`, `off`. Defaults to `off`. (see https://www.npmjs.com/package/morgan)
* DEBUG - see debugging section

For OAuth authentication:

* AUTH_STATEGY - the method used by users for authentication. One of `basic`, `google`, `facebook`, `github`. Defaults to `basic`. See authentication section.
* ENVOY_URL - for Google/Facebook OAuth authentication
* GOOGLE_CLIENT_ID - for Google OAuth authentication
* GOOGLE_CLIENT_SECRET - for Google OAuth authentication
* FACEBOOK_APP_ID - for Facebook OAuth authentication
* FACEBOOK_APP_SECRET - for Facebook OAuth authentication
* GITHUB_CLIENT_ID - for Github OAuth authentication
* GITHUB_CLIENT_SECRET - for Github OAuth authentication
* TWITTER_CONSUMER_KEY - for Twitter OAuth authentication
* TWITTER_CONSUMER_SECRET - for Twitter OAuth authentication

## Debugging

Debugging messages are controlled by the `DEBUG` environment variable. To see detailed debugging outlining the API calls being made between Envoy and Cloudant then set the `DEBUG` environment variable to `cloudant,nano` e.g

```bash
export DEBUG=cloudant,nano
node app.js
```

or

```bash
DEBUG=cloudant,nano node app.js
```

## Authentication


### Basic

By default, Envoy is configured to use the `basic` authentication stategy. This means that credentials are passed in using HTTP basic authentication e.g.

```
http://myusername:mypassword@myenvoyinstance.mybluemix.net/db/_all_docs
```

This strategy is only designed for testing Envoy as there is no real user database. As long as the supplied password is equal to `sha1(username)`, then we let you in! Here are some sample usernames and passwords you can use for testing:

* username 'rita', password '6fe06f8d903ee0d0242c6f31b94578b2957c9752'
* usename 'sue', password '1eac7bdcbb6c569f15ecbf5cd873a2c477888e56'
* username 'bob', password '48181acd22b3edaebc8a447868a7df7ce629920a'
 
### Google

Setting the `AUTH_STRATEGY` environment variable to 'google' configures Envoy to use Google OAuth2 authentication, so users can sign up for an Envoy account using their Google account. Sign up for OAuth2 credentials from the [Google Developer Console](https://console.developers.google.com/) and use the client id and secret in environment variables e.g.:

```
export AUTH_STRATEGY=google
export GOOGLE_CLIENT_ID="mysecretclientid825125.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="myclientsecret351521"
export ENVOY_URL="http://localhost:8000"
node app.js
```

Then hit the `GET /_auth/google` endpoint in your browser to authenticate.

### Facebook

Setting the `AUTH_STRATEGY` environment variable to 'facebook' configures Envoy to use Facebook for authentication, so users can sign up for an Envoy account using their Facebook account. Sign up for OAuth2 credentials from the [Facebook Developer Dashboard](https://developers.facebook.com/) and use the app id and secret in environment variables e.g.:

```
export AUTH_STRATEGY=facebook
export FACEBOOK_APP_ID="myclientid825125"
export FACEBOOK_APP_SECRET="myclientsecret351521"
export ENVOY_URL="http://localhost:8000"
node app.js
```

Then hit the `GET /_auth/facebook` endpoint in your browser to authenticate.

### GitHub

Setting the `AUTH_STRATEGY` environment variable to 'github' configures Envoy to use GitHub for authentication, so users can sign up for an Envoy account using their Facebook account. Sign up for OAuth2 credentials from the [Git Hub Developers page](https://github.com/settings/applications/new), making sure you set the Authorization Callback URL to `<your Envoy URL>/_auth/github/callback` and use the app id and secret in environment variables e.g.:

```
export AUTH_STRATEGY=github
export GITHUB_CLIENT_ID="myclientid825125"
export GITHUB_CLIENT_SECRET="myclientsecret351521"
export ENVOY_URL="http://localhost:8000"
node app.js
```

Then hit the `GET /_auth/github` endpoint in your browser to authenticate.


### Twitter

Setting the `AUTH_STRATEGY` environment variable to 'twitter' configures Envoy to use Twitter for authentication, so users can sign up for an Envoy account using their Facebook account. Sign up for OAuth2 credentials from the [Twitter Developers page](https://apps.twitter.com/app/new), making sure you set the Authorization Callback URL to `<your Envoy URL>/_auth/github/callback` (localhost not allowed) and use the consumer key and secret in environment variables e.g.:

```
export AUTH_STRATEGY=twitter
export TWITTER_CONSUMER_KEY="myclientid825125"
export TWITTER_CONSUMER_SECRET="myclientsecret351521"
export ENVOY_URL="http://mydomain.name.com:8000"
node app.js
```

Then hit the `GET /_auth/github` endpoint in your browser to authenticate.
https://apps.twitter.com/app/new


## Introduction

Cloudant has the potential to be an ideal backend for a mobile application. It is scalable, it syncs, and being schema-free it can cope with the frequent data changes that tend to happen in mobile development.

However, Cloudant was never designed to be an _mbaas_ – a complete mobile application backend, and comparisons with dedicated mobile application backends such as Facebook's (now defunct) _Parse_ stack highlight our shortcomings in this area. Some of the problematic areas include:

* _Authorisation_

    Many use cases suitable for a database-backed mobile app require record-level access controls to ensure that each user can only see and update their own data. This problem is compounded by the need for analytics across the whole data set. The currently recommended solution of a database per user and replication of all user databases into a single analytics database is not viable as the number of users grow beyond a certain number.

* _Authentication_

    Every mobile enterprise application will likely need to tap into an existing user database, be it a local LDAP server or a third-party OAuth2 provider, like Facebook or Google.

* _Unreliable networks_

    A mobile app needs to carry on working in the face of unreliable networks. Cloudant's approach is to use its excellent replication capabilities to do bi-directional sync to a local data store on the device, but this is only viable for small data sets as mobile devices by their very nature have limited storage facilities. 
   

There are many different ways to address these issues, client side, server side, or in a middle layer. We propose that a thin middleware gateway application be constructed. The reason for this is that it would allow the mobile-specific functionality could be kept separate from the database itself. The _mbaas_ aspect can be developed independently which means less complexity in the core and the development time and cost can be spread across more people.

## Goals: Cloudant Envoy gateway

`Cloudant Envoy` is a thin gateway server application that sits between a Cloudant database and a mobile application. It implements document-level auth, users (and the beginnings of groups; not yet complete). This would provide a way around the first and the third problem areas as described above: each app would be backed by a single database instead of a database per user, and reads and changes would be filtered by user identity.

It is important to understand what this _isn't_. This isn't intended to be a new replicator, or even a way of providing features for other use cases: the intention is to make us more competitive in the mobile sphere. By its very nature (e.g. millions of simultaneous users) this layer needs to be as thin as it can be in order to not to become a bottle neck.

The Envoy server should not present an undue load on the underlying Cloudant cluster: if a million sync requests imply a million changes feeds, we're no better off than the million user databases replicating to a single analytics database. In order to make this robust it may be necessary to have a single changes feed follower pushing data onto an external message queue which can be scaled separately.

Here's what this currently does:

1. Implement a per-document access rights model and the corresponding CRUD API calls
2. Ensure that the replication-specific end points respect the access rights model
3. CORS

Here's what's currently outstanding:

1. Extend Query to always implicitly search based on user
2. Implement a new set of API end points to allow the registration of a new user
3. Implement auth against third-party authentication services
4. Groups concept is not fully fleshed out

## Per document access rights

Central to the proposed solution is to add a new private field into each document which carries access rights information:

```json
{
    "_id": "c3065e59c9fa54cc81b5623fa06902f0",
    "_rev": "1-9f7a5dd995bf4953bdb53f22f9b73558",
    "com.cloudant.meta": {
        "auth": {
            "users": [ "harry", "hermione", "ron" ],
            "groups": [ ]
        }
    },
    "age": 5,
    "type": "owl"
}
```

This states that the users `harry`, `hermione` and `ron` all can read, write and delete this document. The `com.cloudant.meta` field will be inserted on create, maintained on updates, but removed before a document is returned in response to a client request. Obviously, this field will be visible from the Cloudant console and in responses to client requests which go to the underlying database directly, bypassing the new layer.

The `groups` list will allow groups of users to be granted access. For the initial release, there will only be a single, fixed group called `public` which grants read-only access to the document to every user.

We do not expose views in this new layer: client data access will need to be via Query only. This is vital.

If I am user `harry` and I create a new document, the assumption is that I am the sole user with access rights:

```curl
curl 'https://harry:alohomora@hogwarts.com/creatures' \
     -X PUT \
     -H "Content-Type: application/json" \
     -d '{ "age": 456, "type": "thestral" }'
```

will result in the following document being written to the database:

```json
{
    "_id": "0d711609b3ab27a9069e7da766d93334",
    "_rev": "1-42261671e23759c51e7f0899ee99418d",
    "com.cloudant.meta": {
        "auth": {
            "users": [ "harry" ],
            "groups": [ ]
        }
    },
    "age": 456,
    "type": "thestral"
}
```

and if I read the document with

```curl
curl 'https://harry:alohomora@hogwarts.com/creatures/0d711609b3ab27a9069e7da766d93334'
```

the result should be

```json
{
    "_id": "0d711609b3ab27a9069e7da766d93334",
    "_rev": "1-42261671e23759c51e7f0899ee99418d",
    "age": 456,
    "type": "thestral"
}
```

If `hermione` now were to request this document she should get a `401 Unauthorized` response.

CouchDB uses certain special fields that starts with an underscore to denote metadata. Ideally, we'd use something like "_auth" for our purpose, but CouchDB will strip out any underscored fields it doesn't recognise. For this reason, we use the field name `com.cloudant.meta`, as we don't want to modify the behaviour of the CouchDB underneath. The consequence this has is that documents may not contain a field called
`com.cloudant.meta`. 

## Filtered replication 

With this in place we can tackle the other problem: subset or filtered replication. Given that we now have a single database backing the app used by multiple users we need to ensure that mobile sync also obeys the access rules. This means that we need to ensure that the `changes`, `bulk_docs` and `revs_diff` end points also respect the authentication rules.


## CRUD API

We'd need to implement the following parts of the CouchDB CRUD API.

### HEAD|GET _/{db}/{docid}_

If the requesting user isn't either in the `users` list or the document has the group `public` listed, the request should fail with a `401 Unauthorized` response.

### POST|DELETE _/{db}/{docid}_

If the requesting user isn't in the `users` list, the request should fail with a `401 Unauthorized` response. Note that the `public` group grants read access only.

### PUT _/{db}/{docid}_

Create a new document with the creating user in the `users` list.

## Replication API

### POST _/{db}/\_bulk_docs_

Should behave like the current, but where new documents are created, they should have the creating user added to the `users` field, and where documents are provided with `{_id, _rev}` these should be subjected to the authorisation check as for a `POST` to `/{db}/{docid}`.

Note: this is potentially a performance problem as we need to check ownership of every document in the list that is given with `{_id, _rev}`. It may be possible to implement this efficiently by first requesting all docs representing updates using `_all_docs?keys=[key1, key2, ..., keyN]` (or the POST version, rather) and validating the auth details.

### GET _/{db}/\_changes_

The changes feed should be filtered according to the same rules as a `GET` to `/{db}/{docid}`: only return changes related to documents where the requesting user is either listed in the `users` list, or the document has the `public` group ownership.

### POST _/{db}/\_revs\_diff_

RevsDiff should check the returned list according to the same rules as a `GET` to `/{db}/{docid}`: only return changes related to documents where the requesting user is either listed in the `users` list, or the document has the `public` group ownership.

## Cloudant Query API

### POST _/{db}/\_index

Creates a Cloudant Query index, supplementing the index to allows the ownership of a document to be queried.

### POST _/{db}/\_find

Queries using Cloudant Query only returning the querying user's documents.

### Cloudant Query Group support (not implemented)

In order to respect groups, the query would have to be modified like so:

```json
{
    "selector": {
        "$or": [
            "auth.users":  { "$elemMatch": { "$eq": "USER" } },
            "auth.groups": { "$elemMatch": { "$eq": "public" } }
        ]
    }  
}
```

to ensure that the user can only see the documents they are authorised to see. The current implementation only uses auth.users.
