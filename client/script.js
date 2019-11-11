/* eslint-disable no-debugger */
const socket = io()
let mapObjects
let mapHole

socket.on('initPlayer', (packet) => {
  const h1 = document.createElement('h1')
  const message = `You are player ${packet.playerId}`
  h1.textContent = message
  document.querySelector('body').append(h1)

  mapObjects = packet.mapObjects
  mapHole = packet.hole
})

function drawMap(){
  ctx.beginPath()
  ctx.arc(mapHole.x, mapHole.y, mapHole.radius, 0, 2*Math.PI)
  ctx.fillStyle = 'black'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#003300'
  ctx.stroke()

  mapObjects.forEach(mapObject => {
    ctx.beginPath()
    ctx.rect(mapObject.x, mapObject.y, mapObject.width, mapObject.height)
    ctx.fillStyle = 'black'
    ctx.fill()
    ctx.stroke()
  })
}

const canvas = document.querySelector('#game')
const ctx = canvas.getContext('2d')

socket.on('ballPositions', (pack)=> {
  ctx.clearRect(0,0,400,600)
  //draw hole
  drawMap()

  pack.forEach(pack => {
    const playerId = Object.keys(pack)[0]
    const ballPos = pack[playerId]
    ctx.beginPath()
    ctx.arc(ballPos.x, ballPos.y, 15, 0, 2 * Math.PI)
    ctx.fillStyle = 'white'
    ctx.fill()
    ctx.fillStyle = '#000000'
    ctx.fillText(playerId, ballPos.x, ballPos.y)
    ctx.lineWidth = 2
    ctx.strokeStyle = '#003300'
    ctx.stroke()
  })
})

socket.on('playerWins', () => {alert('YOU WIN')} )

document.addEventListener('click', (e) => {
  //https://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
  //find mouse click x,y
  let x
  let y
  if (e.pageX || e.pageY) {
    x = e.pageX
    y = e.pageY
  } else {
    x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft
    y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop
  }

  const mouseClickPos = {
    x: x -= canvas.offsetLeft,
    y: y -= canvas.offsetTop
  }

  socket.emit('mouseClick', mouseClickPos)
})
