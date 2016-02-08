function (doc) {
  if (doc['com.cloudant.meta']) {
    if (doc['com.cloudant.meta'].auth.users) {
      for (var i in doc['com.cloudant.meta'].auth.users) {
        emit(doc['com.cloudant.meta'].auth.users[i], 1);
      }
    }
    if (doc['com.cloudant.meta'].auth.groups) {
      for (var j in doc['com.cloudant.meta'].auth.groups) {
        emit(doc['com.cloudant.meta'].auth.groups[j], 1);
      }
    }
  }
}
