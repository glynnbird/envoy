# Contributing to Cloudant Envoy

## Contributor License Agreement

In order for us to accept pull-requests, the contributor must first complete
a Contributor License Agreement (CLA). This clarifies the intellectual 
property license granted with any contribution. It is for your protection as a 
Contributor as well as the protection of IBM and its customers; it does not 
change your rights to use your own Contributions for any other purpose.

This is a quick process: one option is signing using Preview on a Mac,
then sending a copy to us via email.

You can download the CLAs here:

 - [Individual](http://cloudant.github.io/cloudant-sync-eap/cla/cla-individual.pdf)
 - [Corporate](http://cloudant.github.io/cloudant-sync-eap/cla/cla-corporate.pdf)

If you are an IBMer, please contact us directly as the contribution process is
slightly different.

## Coding guidelines

- Almost all Pull Requests for features or bug fixes will need tests
- We follow [Felix's Node.js Style Guide](https://github.com/felixge/node-style-guide)
- Almost all Pull Requests for features or bug fixes will need tests (seriously, its really important)
- Before opening a pull request run `$ npm test` to lint test the changes and run node tests. Preferably run the browser tests as well.
- Commit messages should follow the following style:

```
(#99) - A brief one line description < 50 chars

Followed by further explanation if needed, this should be wrapped at
around 72 characters. Most commits should reference an existing
issue
```

## Contributing your changes

We follow a fairly standard procedure:

- Fork the repo into your own account, clone to your machine.
- Create a branch with your changes on (`git checkout -b my-new-feature`)
  - Make sure to update the CHANGELOG and CONTRIBUTORS before sending a PR.
  - All contributions must include tests.
  - Try to follow the style of the code around the code you
    are adding -- the project contains source code from a few places with
    slightly differing styles.
- Commit your changes (`git commit -am 'Add some feature'`)
- Push to the branch (`git push origin my-new-feature`)
- Issue a PR for this to our repo.
