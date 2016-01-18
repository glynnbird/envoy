# cds-mobile

<img src="https://travis.innovate.ibm.com/CloudDataServices/cds-mobile.svg?token=t57QjqTUQ8rv6Xvy4sDm"/>

## Set up

`% npm install`

## Configure

Copy `run.sh.example` to `run.sh` and `chmod +x run.sh`. Then edit `run.sh` to use your account, API key, port and so on.

## Run

`% ./run.sh npm start`

Note that the app expects the remote database to exist and be called `mbaas`.

## Developers

Unit tests are executed using mocha (the server is automatically started):

`% ./run.sh mocha`
