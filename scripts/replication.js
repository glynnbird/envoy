// Use  pouchdb-dump testdb > dump.txt to
// check what the replication yielded.
'use strict';

const PouchDB = require('pouchdb'),
  fs = require('fs'),
  url = require('url'),
  async = require('async'),
  chance = require('chance')();

require('dotenv').config();

const maxdoc = 5;

const user = process.env.USERNAME,
  pass = process.env.PASS,
  host = process.env.HOST,
  dbname = process.env.LOCALDB,
  port = parseInt(process.env.PORT, 10);

if (fs.existsSync(dbname)) {
  fs.readdirSync(dbname).forEach((filename, index) => {
    let path = dbname + '/' + filename;
    fs.unlinkSync(path);
  });
  fs.rmdirSync(dbname);
}

const localDB = new PouchDB(dbname);
const serverURL = url.format({
  protocol: 'http',
  auth: `${user}:${pass}`,
  hostname: host,
  port: port,
  pathname: 'mbaas'
});

function pullReplication() {
  localDB.replicate.from(serverURL).on('change', (info) => {
    console.log('Replication changed state:', JSON.stringify(info, null, 2));
  }).on('paused', function () {
    console.log('Replication paused');
  }).on('active', function () {
    console.log('Replication active');
  }).on('denied', function (info) {
    console.log('Permission denied:', JSON.stringify(info, null, 2));
  }).on('complete', function (info) {
    console.log('Replication complete:', JSON.stringify(info, null, 2));
  }).on('error', function (err) {
      console.error(err);
  });
}

function pushReplication() {
  localDB.replicate.to(serverURL).on('change', (info) => {
    console.log('Replication changed state:', JSON.stringify(info, null, 2));
  }).on('paused', function () {
    console.log('Replication paused');
  }).on('active', function () {
    console.log('Replication active');
  }).on('denied', function (info) {
    console.log('Permission denied:', JSON.stringify(info, null, 2));
  }).on('complete', function (info) {
    console.log('Replication complete:', JSON.stringify(info, null, 2));
  }).on('error', function (err) {
      console.error(err);
  });
}

// pullReplication();

function makeDocs(callback) {
  let docs = [];
  for (let i=0; i<maxdoc; i++) {
    docs.push({
      jobid: chance.guid(),
      description: chance.paragraph({sentences: 2}),
      client: {
        firstname: chance.first(),
        lastname: chance.last(),
        address: chance.address(),
        city: chance.city(),
        state: chance.state({full: true}),
        phone: chance.phone(),
        zip: chance.zip(),
        email: chance.email()
      }
    });
  }

  // Add some local documents
  localDB.bulkDocs(docs).then((response) => {
    console.log(response);
    callback(null, `Added ${maxdoc} to the local database`);
  }).catch((err) => {
    callback(err, err);
  });
}

async.series([makeDocs], (err, res) => {
  if (err) {
    console.error(err);
  } else {
    pushReplication();
  }
});
