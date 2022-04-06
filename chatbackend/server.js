'use strict';

const express = require('express');
const app = express();
const socket = require('socket.io');
const color = require('colors');
const cors = require('cors');
const { join_User, get_Current_User, user_Disconnect } = require('./user');

app.use(express());

const port = process.env.PORT || 8000;

app.use(cors());

let server = app.listen(
    port, console.log(`server is running on the port ${port}`.green)
);

const io = socket(server);

io.on('connection', (socket) => {
    //new user joining the room
    socket.on('joinRoom', ({ username, roomname }) => {
        //  create user
        const p_user = join_User(socket.id, username, roomname);
        console.log(socket.id, ' = id');
        socket.join(p_user.room);

        //display a welcome message to the user who have joined a room
        socket.emit('message', {
            userId: p_user.id,
            username: p_user.username,
            text: `welcome ${p_user.username}`,
        })

        //displays a joined room message to all other room users except that particular user
        socket.broadcast.to(p_user.room).emit('message', {
            userId: p_user.id,
            username: p_user.username,
            text: `${p_user.username} has joind this chat`,
        })
    });

    //user sending message
    socket.on('chat', (text) => {
        //gets the room user and the message sent
        const p_user = get_Current_User(socket.id);

        io.to(p_user.room).emit('message', {
            userId: p_user.id,
            username: p_user.username,
            text: text,
        })
    })

    //when the user exits the room
    socket.on('disconnected', () => {
        const p_user = user_Disconnect(socket.id);

        if (p_user) {
            io.to(p_user.room).emit('message', {
                userId: p_user.id,
                username: p_user.username,
                text: `${p_user.username} has left this room`,
            })
        }
    })

})