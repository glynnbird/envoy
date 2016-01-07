# CDS-Mobile

_by: Stefan Kruger_

## Introduction

Cloudant has the potential to be an ideal backend for a mobile application. It is scalable, it syncs, and being schema free it can cope with the frequent data changes that tend to happen in mobile development.

However, Cloudant was never designed to be an _mbaas_ – a complete mobile application backend, and comparisons with dedicated mobile application backends such as Facebook's _Parse_ stack highlight our shortcomings in this area. Some of the problematic areas include:

* _Authorisation_

    Many use cases suitable for a database-backed mobile app require record-level access controls to ensure that each user can only see and update their own data. This problem is compounded by the need for analytics across the whole data set. The currently recommended solution of a database per user and replication of all user databases into a single analytics database is not viable as the number of users grow beyond a certain number.

* _Authentication_

    Every mobile enterprise application will likely need to tap into an existing user database, be it a local LDAP server or a third-party OAuth2 provider, like Facebook or Google.

* _Unreliable networks_

    A mobile app needs to carry on working in the face of unreliable networks. Cloudant's approach is to use its excellent replication capabilities to do bi-directional sync to a local data store on the device, but this is only viable for small data sets as mobile devices by their very nature have limited storage facilities. 
   

There are many different ways to address these issues, client side, server side, or in a middle layer. We propose that a thin middleware gateway application be constructed. The reason for this is that it would allow the mobile-specific functionality could be kept separate from the database itself. The _mbaas_ aspect can be developed independently which means less complexity in the core and the development time and cost can be spread across more people.

## POC Goals: cds-mobile gateway

`CDS Mobile` is a thin gateway server application that sits between a Cloudant database and a mobile application. It implements document-level auth, users and groups. This would provide a way around the first and the third problem areas as described above: each app would be backed by a single database instead of a database per user, and reads and changes would be filtered by user identity.

It is important to understand what this _isn't_. This isn't intended to be a new replicator, or even a way of providing features for other use cases: the intention is to make us more competitive in the mobile sphere. By its very nature (e.g. millions of simultaneous users) this layer needs to be as thin as it can be in order to not to become a bottle neck.

The cds-mobile server should not present an undue load on the underlying Cloudant cluster: if a million sync requests imply a million changes feeds, we're no better off than the million user databases replicating to a single analytics database. Beyond the POC it may be necessary to have a single changes feed follower pushing data onto an external message queue which can be scaled separately.

The various aspects of this work will be tackled in the following order:

1. Implement a per-document access rights model and the corresponding CRUD API calls
2. Extend Query to always implicitly search based on user
3. Implement a new set of API end points to allow the registration of a new user [?]
4. Ensure that the replication-specific end points respect the access rights model
5. Implement auth against third-party authentication services

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

We do not expose views in this new layer for the POC: client data access will need to be via Query.

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

## Cloudant Query

All query requests need to implicitly add on a

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

to ensure that the user can only see the documents they are authorised to see. The relevant indexes on the `auth` field should be created automatically.

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
