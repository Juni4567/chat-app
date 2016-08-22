var express = require('express'),
	session = require('express-session'),
	bodyParser = require('body-parser'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	uuid = require('node-uuid'),
	model = require('./model'),
	User = model.User,
	MongoClient = require('mongodb').MongoClient,
	ObjectId = require('mongodb').ObjectID,
	repository = require('./repository'),
	UserRepository = repository.UserRepository,
	MessageRepository = repository.MessageRepository,
	allUsersStatus = {},
	allTokensForUser = {},
	allUsersSockets = {};

server.listen(3000);

app.use(session({
  		secret: 'ssshhhhh',
  		resave: true,
  		saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  		extended: false
}));

app.set('view engine', 'pug');
//Views directory
app.set('views', __dirname + '/public/views');

app.use('/public', express.static('public'));

var dbConnection;
var url = 'mongodb://localhost:27017/chat';
MongoClient.connect(url, function (err, db) {
  if (err == null) {
    console.log('Connected correctly to database server.');
    dbConnection = db;
    UserRepository.getAllUsers(dbConnection, function (user) {
      var userName = user.userName;
      allUsersStatus[userName] = 'offline';
    });
  } else {
    console.log(err);
  }
});


app.get('/', function (req, res) {
  var userSession = req.session;
  var userName = userSession.userName;
  console.log(userSession.isValidUser);
  if (userSession && userSession.isValidUser && userName) {
    var token = uuid.v4();
    allTokensForUser[token] = userName;
    res.render('chat', {
      'token': token,
      'userName': userName
    });
    newUserOnline(userName);
  } else {
    res.render('login', {
      'isValidUser': userSession.isValidUser
    });
  }
});
app.post('/authenticate', function (req, res) {
  var validUser = false;
  var userName = req.body.userName;
  var password = req.body.password;
  req.session.userName = userName;
  UserRepository.getUserByUserNameAndPassword(dbConnection, userName, password, function (userValidity) {
    validUser = userValidity;
    req.session.isValidUser = validUser;
    res.redirect('/');
  });
});
app.use('/register', function (req, res) {
	var userName = req.body.userName;
	var password = req.body.password;
	var confirmPassword = req.body.confirmPassword;

	console.log("userName : " + userName);
	console.log("password : " + password);
	console.log("confirmPassword : " + confirmPassword);

	if(userName == undefined || password == undefined || confirmPassword == undefined){
		console.log('no values');
		res.render('register',{});
	} else if(password != confirmPassword) {
		console.log('password');
		res.render('register',{"isValid":false,"msg":"Please re-enter details. Your passwords didn't match."});
	} else {
		UserRepository.getUserByUserName(dbConnection, userName, function (userExists) {
			if(userExists){
				console.log('user');
				res.render('register',{"isValid":false,"msg":"This username has already been taken."});
			} else {
				var user = {"userName":userName,"password":password};
				UserRepository.saveUser(dbConnection, user, function (response) {
		        if(response){
		        	req.session.userName = userName;
		        	req.session.isValidUser = true;
		        	res.redirect('/');
		        }
		      });
			}
		});	
	}
});

function checkIfUserNameExists(userName){
	
}
function newUserOnline(userName) {
  if (allUsersStatus[userName] != 'online') {
    allUsersStatus[userName] = 'online';
    sendUserUpdateEvent();
  }
}
function sendUserUpdateEvent() {
  io.sockets.emit('updateUserList', allUsersStatus);
}
io.sockets.on('connection', function (socket) {
  console.log('new socket created');
  socket.on('newUserChat', function (token, fn) {
    if (token != undefined) {
      socket.token = token;
      var userName = allTokensForUser[token];
      if (allUsersSockets[userName] == undefined) {
        allUsersSockets[userName] = [socket.id];
      } else {
        allUsersSockets[userName].push(socket.id);
      }
    }
    MessageRepository.getAllMessagesForUserOrderByDateAsc(dbConnection, userName, function (allMessages) {
      console.log(allMessages);
      fn(allUsersStatus, allMessages);
    });
  });
  socket.on('send message', function (data, callback) {
    var msg = data.msg;
    var targetUser = data.to;
    var sourceToken = socket.token;
    var sourceUser = allTokensForUser[sourceToken];
    var targetSocket = allUsersSockets[targetUser];
    if (sourceToken && sourceUser) {
      var message = {
        'from': sourceUser,
        'to': targetUser,
        'msg': msg,
        'createdTime': new Date()
      };
      for (var i = 0; targetSocket && i < targetSocket.length; i++) {
        io.to(targetSocket[i]).emit('newMessage', message);
      }
      MessageRepository.saveMessage(dbConnection, message, function (response) {
        callback(response);
      });
    } else {
      callback(false);
    }
  });
  socket.on('disconnect', function () {
    var sourceToken = socket.token;
    var sourceUser = allTokensForUser[sourceToken];
    delete allTokensForUser[sourceToken];
    var index = allUsersSockets[sourceUser].indexOf(socket.id);
    if (index != - 1 && sourceUser) {
      allUsersSockets[sourceUser].splice(index, 1);
      if (allUsersSockets[sourceUser].length == 0) {
        console.log(sourceUser + ' gone offline');
        allUsersStatus[sourceUser] = 'offline';
        sendUserUpdateEvent();
      }
    }
  });
});
