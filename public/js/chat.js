const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Option
const { username, room} = Qs.parse(location.search, { ignoreQueryPrefix:true}) // ignoreQueryPrefix:true --> ? goes away

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visable height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = ($messages.scrollTop + visibleHeight)+2

    if(containerHeight - newMessageHeight <= scrollOffset) {  //if we were in the bottom before new message send
        $messages.scrollTop = $messages.scrollHeight  //autoscroll
    }
}


socket.on('message',(message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate,{
        username:message.username,
        url:message.url,
        createdAt: moment(message.createdAt).format('HH:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    //autoscroll()
})


socket.on('roomData',({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault() //default will refresh when submit, but we want to stay
    
    $messageFormButton.setAttribute('disabled','disabled') //diable the button

    const message = e.target.elements.message.value
    socket.emit('sendMessage',message, (error) => {
        $messageFormButton.removeAttribute('disabled')  //enable the button
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click',() => {
    if(!navigator.geolocation){
        return alert('geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        }, (message) => {
            console.log(`${message}`)
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', {username, room} , (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})