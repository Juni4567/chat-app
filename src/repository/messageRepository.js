module.exports = {
	getAllMessagesForUserOrderByDateAsc: function(db, userName, callback){
		var cursor = db.collection('messages').find({
			$or: [{"from":userName}, {"to":userName}]
		}).sort({"createdDate":1});
		var allMessages = [];
		cursor.each(function (err, doc) {
      if (err == null && doc != null) {
        delete doc['_id'];
        allMessages.push(doc);
      } else if(err==null && doc == null) {
        callback(allMessages);
      } else {
      	console.log('data : ' + doc);
        console.log('error : ' + err);
      }
    });

	},
	saveMessage: function(db, message, callback){
		db.collection('messages').insertOne(message, function(err, result){
			if(err == null){
				console.log('Message successfully saved in database.');
				callback(true);
			} else {
				callback(false);
			}
		});
	}
}