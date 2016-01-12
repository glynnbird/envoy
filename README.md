# cds-mobile

## Set up

`% npm install`

## Configure

Create a creds.json file, it should look like:

```
{
    "account": "your username",
    "key": "an API key",
    "password": "its password"
}
```

## Run

`% npm start`

This will start the server listening on port 8080 by default. To run it on a different port, use

`% PORT=3000 npm start`

Note that the app expects the remote database to exist and be called `mbaas`.
