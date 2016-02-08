function(doc, req) {
  if (doc && 
    doc['com.cloudant.meta'] && 
    doc['com.cloudant.meta'].auth.users &&
    req &&
    req.query &&
    req.query.mbaasuser) {
    return doc['com.cloudant.meta'].auth.users.indexOf(req.query.mbaasuser) >= 0;
  }
  return false;
}