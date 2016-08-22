$(document).ready(function () {
  var messages = $('#myMsg');
  var myMsg = $('#myMsg');
  var socket = io.connect();
  socket.on('connect', function () {
    socket.emit('newUserChat', token, function (userList, allMessages) {
      updateUserList(userList);
      updateMessages(allMessages);
    });
  });
  socket.on('updateUserList', function (userList) {
    updateUserList(userList);
  });
  socket.on('newMessage', function (message) {
    newMessage(message.from, message.to, message.msg)
  });
  function updateUserList(userList) {
    var html = '';
    for (var key in userList) {
      if (key != userName) {
        html += '<input type=\'radio\' name=\'userList\' value=\'' + key + '\' >' + key + ' <span class=\''+userList[key]+'\'>O</span><br>';
      }
    }
    $('#usersList').empty().append(html);
  }
  function updateMessages(allMessages){
    allMessages.forEach( function (thisMsg) {
      newMessage(thisMsg.from, thisMsg.to, thisMsg.msg);
    });
  }
  function sendMessage() {
    var toUser = $('input[name=\'userList\']:checked').val();
    if (toUser == undefined) {
      showErrorMessage('Please select a user to send message');
      return;
    }
    var msg = myMsg.val().trim();
    if (msg == undefined || msg == "") {
      showErrorMessage('Please write something to send');
      return;
    }
    socket.emit('send message', new Message(toUser, msg), function(result){
    	if(result == false){
    		showErrorMessage('Failed to authenticate your request. Please login again.');
    	} else {
    		newMessage(userName, toUser, msg)
    		myMsg.val('');
    	}
    });
    
  }
  function newMessage(from, to, msg) {
    $('#messages').append('<b>' + from + ' -> ' + to + ' : </b>' + msg + '</br>');
    $('#messages').scrollTop($('#messages')[0].scrollHeight);
  }
  function showErrorMessage(errMsg){
  	$('#errorMsg').show();
  	$('#errorMsg').html(errMsg);
  	setTimeout(function() {
  		$('#errorMsg').fadeOut('fast');
  	}, 3000);
  }

  $('#user #sendMsg').click(function (e) {
    sendMessage();
  });
  $('#user #myMsg').bind('keyup', function (e) {
    if (e.keyCode === 13) {
      sendMessage();
    }
  });
});
