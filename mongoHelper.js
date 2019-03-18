module.exports = {
  insertObjToCollection : function (db, dbo, objectToCompare, objectToInsert, collectionString) {
    dbo.collection(collectionString).findOne(objectToCompare, function(err, doc) {
      if( doc == null ) {
        dbo.collection(collectionString).insertOne(objectToInsert, function(err, res) {
          if (err) throw err;
          console.log("1 document inserted");
          db.close()
          return true;
        });

      } else {
        db.close()
        return false;

      }
    });
  }

}
