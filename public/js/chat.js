(function () {
  const socket = io('http://localhost:3000')

  const messagesElement = document.getElementById('messages')
  const messageElement = document.getElementById('message')
  const sendButton = document.getElementById('send')
  const disconnectButton = document.getElementById('disconnect')
  const connectionElement = document.getElementById('connection')
  const typingElement = document.getElementById('typing')

  let init = false
  let typing = false
  let typingTimeout = 5000
  let sendingTypingTimer = null
  let gettingTypingTimer = null

  messageElement.addEventListener('keydown', e => {
    if (e.keyCode == 13) {
      sendMessage()
    }
  })

  messageElement.addEventListener('input', e => {
    if (!typing) {
      socket.emit('typing')

      sendingTypingTimer = setTimeout(() => {
        typing = false
      }, typingTimeout)

      typing = true
    }
  })

  messageElement.addEventListener('focus', e => {
    scrollDown()
  })

  sendButton.addEventListener('click', e => {
    sendMessage()

    messageElement.focus()
  })

  disconnectButton.addEventListener('click', e => {
    socket.emit('leave', window.localStorage.room)

    disconnect()
  })

  socket.on('message', message => {
    writeMessage('stranger', message)
  })

  socket.on('typing', () => {
    toggleTyping('')

    clearTimeout(gettingTypingTimer)

    gettingTypingTimer = setTimeout(() => {
      toggleTyping('none')
    }, typingTimeout + 1000)

    scrollDown()
  })

  socket.on('pending', () => {
    connectionElement.textContent = 'Waiting for stranger...'
  })

  socket.on('started', room => {
    connect(room)
  })

  socket.on('joined', hasStranger => {
    if (hasStranger) {
      connect(window.localStorage.room)
    } else {
      connectionElement.textContent = 'You are alone.'
      writeMessage('server', 'Ooops! Looks like the stranger is gone. You are encouraged to start a new conversation.')
      disableElements()
      disconnectButton.disabled = false
    }
  })

  socket.on('leave', () => {
    disconnect()
  })

  socket.on('connected', () => {
    writeMessage('server', 'The stranger has connected.')
    connectionElement.textContent = 'You are now connected.'
    enableElements()
  })

  socket.on('disconnected', () => {
    writeMessage('server', 'The stranger has disconnected. Trying to connect again...')
    disableElements()
    disconnectButton.disabled = false
  })

  socket.on('disconnect', () => {
    disableElements()
    writeMessage('server', 'Connection lost. Trying to reconnect...')
  })

  socket.on('connect', () => {
    enableElements()

    if (init) {
      writeMessage('server', 'Reconnected.')
      socket.emit('join', window.localStorage.room)
    } else {
      if (window.localStorage.room) {
        socket.emit('join', window.localStorage.room)
      } else {
        socket.emit('new')
      }
    }

    init = true
  })

  function connect(room) {
    connectionElement.textContent = 'You are now connected.'
    window.localStorage.room = room

    enableElements()
  }

  function writeMessage(from, message) {
    const section = document.createElement('section')
    const p = document.createElement('p')
    const strong = document.createElement('strong')
    const span = document.createElement('span')

    section.classList.add(from)
    strong.textContent = from + ': '
    span.textContent = message

    p.appendChild(strong)
    p.appendChild(span)
    section.appendChild(p)

    messagesElement.insertBefore(section, messagesElement.childNodes[messagesElement.childElementCount])

    toggleTyping('none')

    scrollDown()
  }

  function sendMessage() {
    const message = messageElement.value

    if (message.length > 0) {
      socket.emit('message', message)

      writeMessage('you', message)

      messageElement.value = ''

      clearTimeout(sendingTypingTimer)
      typing = false
    }
  }

  function disconnect() {
    disableElements()

    const section = document.createElement('section')
    const strong = document.createElement('strong')
    const button = document.createElement('button')

    section.classList.add('new')
    strong.textContent = 'Disconnected.'
    button.textContent = 'new'
    button.id = 'new'
    button.addEventListener('click', e => {
      socket.emit('new')

      removeMessages()
    })

    section.appendChild(strong)
    section.appendChild(button)

    messagesElement.appendChild(section)

    delete window.localStorage.room

    messageElement.value = ''

    scrollDown()
  }

  function disableElements() {
    disconnectButton.disabled = true
    sendButton.disabled = true
    messageElement.disabled = true
  }

  function enableElements() {
    disconnectButton.disabled = false
    sendButton.disabled = false
    messageElement.disabled = false
  }

  function removeMessages() {
    const messages = messagesElement.querySelectorAll('section.you, section.stranger, section.server, section.new')

    messages.forEach(message => {
      messagesElement.removeChild(message)
    })
  }

  function toggleTyping(display) {
    typingElement.style.display = display
  }

  function scrollDown() {
    window.scroll(0, document.body.offsetHeight)
  }
})()
