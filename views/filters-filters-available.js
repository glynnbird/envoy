function(doc, req) {
  if (doc && 
    doc['com_cloudant_meta'] && 
    doc['com_cloudant_meta'].auth &&
    doc['com_cloudant_meta'].auth.users &&
    req.query.mbaasuser) {
    return doc['com_cloudant_meta'].auth.users.indexOf(req.query.mbaasuser) >= 0;
  }
  return false;
}