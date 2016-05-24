function (doc) {
  if (doc['com_cloudant_meta'] && doc['com_cloudant_meta'].auth) {
    if (doc['com_cloudant_meta'].auth.users) {
      for (var i in doc['com_cloudant_meta'].auth.users) {
        emit(doc['com_cloudant_meta'].auth.users[i], 1);
      }
    }
    if (doc['com_cloudant_meta'].auth.groups) {
      for (var j in doc['com_cloudant_meta'].auth.groups) {
        emit(doc['com_cloudant_meta'].auth.groups[j], 1);
      }
    }
  }
}
