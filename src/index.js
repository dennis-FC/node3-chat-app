const path = require('path') //no need to npm install
const http = require('http') //no need to npm install
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage,generateLocationMessage } = require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app) //if we dont do this the express library still do this behind the scene(we want to easily use socket io)
const io = socketio(server) //socket io epxect to call with the raw http server

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public') //__dirname is pwd

app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {
    console.log('New WebSocket connection')
    
    
    socket.on('join', (option, callback) => {  //option = {username, room}
        const {error, user} = addUser({ id: socket.id, ...option })

        if(error) {
            return callback(error)
        }

        socket.join(user.room) // only used in server

        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`)) //send all except me in room

        io.to(user.room).emit('roomData', {
            room: user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(message)){
            return callback('Profanity is not allowed!')
        }


        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('sendLocation',(location,callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback('Location shared')
    })

    socket.on('disconnect',() => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }

        
    })

})

server.listen(port , () => {
    console.log(`Server is up on ${port}!!`)
})