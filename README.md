# cds-mobile

<img src="https://travis.innovate.ibm.com/CloudDataServices/cds-mobile.svg?token=t57QjqTUQ8rv6Xvy4sDm"/>

## Set up

`% npm install`

## Configure

Copy `run.sh.example` to `run.sh` and `chmod +x run.sh`. Then edit `run.sh` to use your account, API key, port and so on.

## Run

`§ ./run.sh`

Note that the app expects the remote database to exist and be called `mbaas`.

## Developers

To run unit tests you will need mocha and supertest:

`% npm install -g mocha`

`% npm install -g supertest`

`% npm link supertest`

Once you have these installed, start the server and run mocha in a different terminal:

`% run.sh`
`% mocha`

The tests assume that the server runs on localhost:8080 as default. If you run the server
on a different port, set the PORT env variable:

`% PORT=8001 mocha`
