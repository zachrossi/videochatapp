$(function() {
    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var COLORS = [
      '#e21400', '#91580f', '#f8a700', '#f78b00',
      '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
      '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];
  
    // Initialize variables
    var $window = $(window);
    var $usernameInput = $('.usernameInput'); // Input for username
    var $messages = $('.messages'); // Messages area
    var $inputMessage = $('.inputMessage'); // Input message input box
  
    var $loginPage = $('.login.page'); // The login page

    var $chatPage = $('.chat.page'); // The chatroom page
    var $videoPage = $('.video'); //video container
    var $buttonsPage = $('.buttons') //button container
    
    
    //Custom buttons
    var $play = $('.play-btn'); //play button
    var $pause = $('.pause-btn'); //pause button
    var $plus15 = $('.plus15-btn'); //forward 15s button
    var $minus15 = $('.minus15-btn'); //rewind 15s button

    // Prompt for setting a username
    var username;
    var connected = false;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $usernameInput.focus();
  
    var socket = io();
  
    const addParticipantsMessage = (data) => {
      var message = '';
      if (data.numUsers === 1) {
        message += "there's 1 participant";
      } else {
        message += "there are " + data.numUsers + " participants";
      }
      log(message);
    }
  
    // Sets the client's username
    const setUsername = () => {
      username = cleanInput($usernameInput.val().trim());
  
      // If the username is valid
      if (username) {
        $loginPage.fadeOut();
        $chatPage.show();
        $videoPage.show();
        videoInit(); 
        $loginPage.off('click');
        $currentInput = $inputMessage.focus();
  
        // Tell the server your username
        socket.emit('add user', username);
      }
    }
  
    // Sends a chat message
    const sendMessage = () => {
      var message = $inputMessage.val();
      // Prevent markup from being injected into the message
      message = cleanInput(message);
      // if there is a non-empty message and a socket connection
      if (message && connected) {
        $inputMessage.val('');
        addChatMessage({
          username: username,
          message: message
        });
        // tell server to execute 'new message' and send along one parameter
        socket.emit('new message', message);
      }
    }
  
    // Log a message
      const log = (message, options) => {
      var $el = $('<li>').addClass('log').text(message);
      addMessageElement($el, options);
    }
  
    // Adds the visual chat message to the message list
    const addChatMessage = (data, options) => {
      // Don't fade the message in if there is an 'X was typing'
      var $typingMessages = getTypingMessages(data);
      options = options || {};
      if ($typingMessages.length !== 0) {
        options.fade = false;
        $typingMessages.remove();
      }
  
      var $usernameDiv = $('<span class="username"/>')
        .text(data.username)
        .css('color', getUsernameColor(data.username));
      var $messageBodyDiv = $('<span class="messageBody">')
        .text(data.message);
  
      var typingClass = data.typing ? 'typing' : '';
      var $messageDiv = $('<li class="message"/>')
        .data('username', data.username)
        .addClass(typingClass)
        .append($usernameDiv, $messageBodyDiv);
  
      addMessageElement($messageDiv, options);
    }
  
    // Adds the visual chat typing message
    const addChatTyping = (data) => {
      data.typing = true;
      data.message = 'is typing';
      addChatMessage(data);
    }
  
    // Removes the visual chat typing message
    const removeChatTyping = (data) => {
      getTypingMessages(data).fadeOut(function () {
        $(this).remove();
      });
    }
  
    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    const addMessageElement = (el, options) => {
      var $el = $(el);
  
      // Setup default options
      if (!options) {
        options = {};
      }
      if (typeof options.fade === 'undefined') {
        options.fade = true;
      }
      if (typeof options.prepend === 'undefined') {
        options.prepend = false;
      }
  
      // Apply options
      if (options.fade) {
        $el.hide().fadeIn(FADE_TIME);
      }
      if (options.prepend) {
        $messages.prepend($el);
      } else {
        $messages.append($el);
      }
      $messages[0].scrollTop = $messages[0].scrollHeight;
    }
  
    // Prevents input from having injected markup
    const cleanInput = (input) => {
      return $('<div/>').text(input).html();
    }
  
    // Updates the typing event
    const updateTyping = () => {
      if (connected) {
        if (!typing) {
          typing = true;
          socket.emit('typing');
        }
        lastTypingTime = (new Date()).getTime();
  
        setTimeout(() => {
          var typingTimer = (new Date()).getTime();
          var timeDiff = typingTimer - lastTypingTime;
          if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
            socket.emit('stop typing');
            typing = false;
          }
        }, TYPING_TIMER_LENGTH);
      }
    }
  
    // Gets the 'X is typing' messages of a user
    const getTypingMessages = (data) => {
      return $('.typing.message').filter(function (i) {
        return $(this).data('username') === data.username;
      });
    }
  
    // Gets the color of a username through our hash function
    const getUsernameColor = (username) => {
      // Compute hash code
      var hash = 7;
      for (var i = 0; i < username.length; i++) {
         hash = username.charCodeAt(i) + (hash << 5) - hash;
      }
      // Calculate color
      var index = Math.abs(hash % COLORS.length);
      return COLORS[index];
    }
  
    // Keyboard events
    $window.keydown(event => {
      // Auto-focus the current input when a key is typed
      if (!(event.ctrlKey || event.metaKey || event.altKey)) {
        $currentInput.focus();
      }
      // When the client hits ENTER on their keyboard
      if (event.which === 13) {
        if (username) {
          sendMessage();
          socket.emit('stop typing');
          typing = false;
        } else {
          setUsername();
        }
      }
    });
  
    $inputMessage.on('input', () => {
      updateTyping();
    });
  
    // Click events
  
    // Focus input when clicking anywhere on login page
    $loginPage.click(() => {
      $currentInput.focus();
    });
  
    // Focus input when clicking on the message input's border
    $inputMessage.click(() => {
      $inputMessage.focus();
    });
  
    // Socket events
  
    // Whenever the server emits 'login', log the login message
    socket.on('login', (data) => {
      connected = true;
      // Display the welcome message
      var message = "Welcome to VShare Chat";
      log(message, {
        prepend: true
      });
      addParticipantsMessage(data);
    });
  
    // Whenever the server emits 'new message', update the chat body
    socket.on('new message', (data) => {
      addChatMessage(data);
    });
  
    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', (data) => {
      log(data.username + ' joined');
      addParticipantsMessage(data);
    });
  
    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', (data) => {
      log(data.username + ' left');
      addParticipantsMessage(data);
      removeChatTyping(data);
    });
  
    // Whenever the server emits 'typing', show the typing message
    socket.on('typing', (data) => {
      addChatTyping(data);
    });
  
    // Whenever the server emits 'stop typing', kill the typing message
    socket.on('stop typing', (data) => {
      removeChatTyping(data);
    });
  
    socket.on('disconnect', () => {
      log('you have been disconnected');
    });
  
    socket.on('reconnect', () => {
      log('you have been reconnected');
      if (username) {
        socket.emit('add user', username);
      }
    });
  
    socket.on('reconnect_error', () => {
      log('attempt to reconnect has failed');
    });

    //customs
    //
    //
    
    //whenever the user presses the play button plays video
    socket.on('play', () => {
        console.log('playing');
        playPause();
    });

    //whenever the user presses the pause button pauses the video
    socket.on('pause', () => {
        console.log('pausing');
        playPause();
    });

    //whenever the user presses the plus 15s button skips 15s on the video
    socket.on('plus15', () => {
        console.log('plus 15 seconds');
        plus15();
    });

    //whenever the user presses the minus 15s button skips 15s on the video
    socket.on('minus15', () => {
        console.log('minus 15 seconds');
        minus15();
    });

    //whenever a user changes the slider location broadcast the change
    socket.on('slider change', (data) => {
        setVideoTime(data);
    });

    //when the play button is clicked emit 'play'
    $play.click(function() {
        socket.emit('play');
    });

    //when the pause button is click emit 'pause'
    $pause.click(function() {
        socket.emit('pause');
    });

    //when the plus 15s button is clicked emit 'plus15'
    $plus15.click(function() {
        socket.emit('plus15');
    });

    //when the minus 15s button is clicked emit 'minus15'
    $minus15.click(function() {
        socket.emit('minus15');
    });

    //toggle fullscreen
   $('.toggle_fullscreen').on('click', function(){
    // if already full screen; exit
    // else go fullscreen
    if (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    ) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } else {
      element = $('.container').get(0);
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    }
  });
    
  
  });


function playPause() {
  var mediaPlayer = document.getElementById('media-video');
    if (mediaPlayer.paused) {
      mediaPlayer.play(); 
      $('.pause-btn').show();
      $('.play-btn').hide();
  } else {
      mediaPlayer.pause(); 
      $('.play-btn').show();
      $('.pause-btn').hide();
  }   
}

function play() {
  var mediaPlayer = document.getElementById('media-video');
}

var socket = io();

var mediaPlayer = document.getElementById('media-video');
var sliderBtn = document.getElementById('slider-btn');
var sliderData = document.getElementById('slider-data');

sliderBtn.value = 0;
sliderBtn.min = 0;
sliderBtn.step = 1;

//mediaPlayer.onloadedmetadata = function() {
  
//};



sliderBtn.addEventListener('input', function() {
  //setVideoTime(sliderBtn.value);
  socket.emit('slider change', sliderBtn.value);
});


mediaPlayer.ontimeupdate = function() {
  sliderBtn.value = Math.round(mediaPlayer.currentTime);
  sliderData.innerHTML = secToMinSec(sliderBtn.max - sliderBtn.value);
};

function videoInit(){
  sliderBtn.max = getVideoLength();
  console.log(sliderBtn.max);
  sliderData.innerHTML = secToMinSec(sliderBtn.max);
}

function plus15() {
    mediaPlayer.currentTime = mediaPlayer.currentTime + 15;
}

function minus15() {
    mediaPlayer.currentTime = mediaPlayer.currentTime - 15;
}

function getVideoLength() {
    return mediaPlayer.duration;
}

function secToMinSec(seconds) {
  var mins = Math.floor(seconds/60);
  var secs = Math.round(seconds%60);
    if (secs < 10){
      secs = "0"+ secs;
    }
  return mins + ":" + secs;
}

function setVideoTime(newTime){
  console.log(parseInt(newTime));
  mediaPlayer.currentTime = newTime;
}
