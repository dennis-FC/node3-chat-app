const path = require('path') //no need to npm install
const http = require('http') //no need to npm install
const express = require('express')
const socketio = require('socket.io')

const app = express()
const server = http.createServer(app) //if we dont do this the express library still do this behind the scene(we want to easily use socket io)
const io = socketio(server) //socket io epxect to call with the raw http server

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public') //__dirname is pwd

app.use(express.static(publicDirectoryPath))

io.on('connection', () => {
    console.log('New wWbSocket connection')
})

server.listen(port , () => {
    console.log(`Server is up on ${port}!!`)
})