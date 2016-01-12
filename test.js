//
// crud tests:
//

// create doc successfully
// create doc successfully, with auth metadata - ensure auth metadata gets overwritten with new metadata
// create doc unsuccessfully, incorrect creds

// read doc successfully
// read doc unsuccessfully, incorrect creds

// update doc successfully, auth medatada is inherited from parent doc
// update doc successfully, with auth metadata - ensure auth metadata is inherited from parent doc
// update doc unsuccessfully, incorrect creds

// delete doc successfully
// delete doc unsuccessfully, incorrect creds

//
// changes feed tests:
//

// preamble:

// insert doc1: owned by foo
// insert doc2: owned by bar
// insert doc3: owned by baz

// invoke _changes: doc1@rev1 seen. save sequence to seq1
// update doc1
// invoke _changes: doc1@rev1, doc1@rev2 seen
// invoke _changes with argument seq=seq1: doc1@rev2 seen
// update doc2 and doc3 to be owned by foo
// invoke _changes: doc1@rev1, doc1@rev2, doc2@rev1, doc3@rev1 seen
// update doc1 to be owned by baz
// invoke _changes: doc2@rev1, doc3@rev1 seen
