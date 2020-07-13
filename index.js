//setting up the node js server with express
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000; //Server on port 3000

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

//Routing 
app.use(express.static(path.join(__dirname, 'public')));

//Chat Room
var numUsers = 0;

io.on('connection', (socket) => {
    var addedUser = false;
    //when the client emits 'new message', this listens and executes
    socket.on('new message', (data) => {
        //we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });

    //when the client emits 'add user', this listens and executes
    socket.on('add user', (username) => {
        if (addedUser) return;

        //we store the username in the socet session for this client
        socket.username = username;
        ++numUsers;
        adedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        //echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    //when the client emits 'typing', we broadcast it to others
    socket.on('typing', () => {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    //when the client emits 'stop typing' we broadcast it to others
    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    //when the user disconnect proform this
    socket.on('disconnect', () => {
        if (addedUser) {
            --numUsers;
        

        //echo globally that is client has left
        socket.broadcast.emit('user left', {
            username: socket.username,
            numUsers: numUsers
        });
    }
    });

    //when user plays
    socket.on('play', () => {
        console.log('emiting play')
        socket.broadcast.emit('play');
    });
    //when user pauses
    socket.on('pause', () => {
        console.log('emiting pause')
        socket.broadcast.emit('pause');
    });

    //when user forwards 15s
    socket.on('plus15', () => {
        console.log('emiting plus15')
        socket.broadcast.emit('plus15');
    });
    //when user rewinds 15s
    socket.on('minus15', () => {
        console.log('emiting minus15')
        socket.broadcast.emit('minus15');
    });

    //When user changes range slider position
    socket.on('slider change', (data) => {
        console.log("sldier changed");
        socket.broadcast.emit('slider change', (data));
    });
});