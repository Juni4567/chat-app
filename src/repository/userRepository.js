module.exports = {
  getAllUsers: function (db, callback) {
    var cursor = db.collection('users').find();
    cursor.each(function (err, doc) {
      if (err == null && doc != null) {
        console.log(doc);
        callback(doc);
      } else {
        console.log('data : ' + doc);
        console.log('error : ' + err);
      }
    });
  },
  getUserByUserNameAndPassword: function(db, userName, password, callback){
    var cursor = db.collection('users').findOne({"userName":userName, "password":password}, function(err, doc){
      if (err == null && doc != null) {
        console.log('User found in database. Logging in.');
        console.log(doc);
        callback(true);
      } else {
        console.log('User not found in database. Can\'t login');
        console.log('data : ' + doc);
        console.log('error : ' + err);
        callback(false);
      }
    });
  },
  getUserByUserName: function(db, userName, callback){
    var cursor = db.collection('users').findOne({"userName":userName}, function(err, doc){
      if (err == null && doc != null) {
        console.log('User found in database.');
        console.log(doc);
        callback(true);
      } else {
        console.log('User not found in database.');
        console.log('data : ' + doc);
        console.log('error : ' + err);
        callback(false);
      }
    });
  },
  saveUser: function(db, user, callback){
    db.collection('users').insertOne(user, function(err, result){
      if(err == null){
        console.log('User successfully saved in database.');
        callback(true);
      } else {
        callback(false);
      }
    });
  }
}
