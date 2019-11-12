module.exports = Game

const Player = require('./player')

const Matter = require('matter-js/build/matter.js')

const Engine = Matter.Engine,
  World = Matter.World,
  Bodies = Matter.Bodies,
  Body = Matter.Body,
  Vector = Matter.Vector

function Game() {
  this.initialize = () => {
    global.window = {} // https://github.com/liabru/matter-js/issues/101#issuecomment-161618366
    const engine = Engine.create()
    this.world = engine.world
    this.world.gravity.y = 0
    this.players = []
    this.messages = []


    Engine.run(engine)

    const static = {isStatic: true}
    const topWall = Bodies.rectangle(400 / 2, 0 - 25, 400, 50, static),
      bottomWall = Bodies.rectangle(400 / 2, 600 + 25, 400, 50, static),
      leftWall = Bodies.rectangle(0 - 25, 600 / 2, 50, 600, static),
      rightWall = Bodies.rectangle(400 + 25, 600 / 2, 50, 600, static)

    const bodies = [topWall, bottomWall, leftWall, rightWall]
    bodies.forEach(body => body.restitution = 0.6)

    World.add(this.world, bodies)

    // function updateMatter(){
    //   Matter.Events.trigger(engine, 'tick', { timestamp: engine.timing.timestamp })
    //   Matter.Engine.update(engine, engine.timing.delta)
    //   Matter.Events.trigger(engine, 'afterTick', { timestamp: engine.timing.timestamp })
    // }
  }

  this.run = () => {
    this.gameTickId = setInterval(() => {
      const pack = []
      this.players.forEach((player) =>{
        if(!player.potted){
          const ballPos = player.ball.position
          const shots = player.shots
          const name = player.name ? player.name : player.id
          pack.push({
            [player.id]: {
              ballPos: ballPos,
              shots: shots,
              name: name
            }
          })
          this.checkIfPotted(player)
        }
      })
      sendPackets(pack,this.players)
    }, 1000/25)

    function sendPackets(pack,players){
      players.forEach((player) =>{
        player.socket.emit('ballPositions', pack)
      })
    }
  }

  this.createBall = () => {
    const ball = Bodies.circle(300, 300, 15)
    ball.frictionAir = 0.03
    World.add(this.world, ball)
    return ball
  }

  this.createRect = (mapObject) => {
    const rect = Bodies.rectangle(mapObject.x + mapObject.width/2, mapObject.y+mapObject.height/2, mapObject.width, mapObject.height, {isStatic: true})
    rect.restitution = 0.6
    World.add(this.world, rect)
    return rect
  }

  this.mouseClicked = function(ball, mousePosition){
    const distance = distanceBetween(ball.position, mousePosition)
    const angle = Vector.angle(ball.position, mousePosition)
    const forceMultiplier = distance / 50 + 1
    const force = 0.005 * forceMultiplier > 0.05 ? 0.05 : 0.005 * forceMultiplier
    // https://stackoverflow.com/a/45118761
    Body.applyForce(ball, ball.position, {
      x: Math.cos(angle) * force,
      y: Math.sin(angle) * force
    })
  }

  this.initMap =function(){

    const hole = this.map.hole
    this.holePos = {x:hole.x,y:hole.y}
    this.holeRadius = hole.radius
    const mapObjects = this.map.mapObjects

    for(const mapObjectId in mapObjects){
      this.createRect(mapObjects[mapObjectId])
    }

  }

  this.checkIfPotted = function(player) {
    if(distanceBetween(player.ball.position, this.holePos) < this.holeRadius && player.ball.speed < 3){
      World.remove(this.world, player.ball)
      player.potted = true
      player.socket.emit('playerPots', {potted: true})
      this.players.every(player => player.potted === true) && this.finish()
    }
  }

  this.finish = function() {
    console.log('finished!!!!!')
    console.log(this)

    const winPacket = {
    }

    this.players.forEach(player => {
      winPacket[player.playerName()] = {shots: player.shots}
    })

    this.players.forEach(player => player.socket.emit('gameWon', winPacket))
    clearInterval(this.gameTickId)
  }


  this.sendMessage = function(message){
    this.messages.push(message)
    this.players.forEach(player => {
      player.sendMessage(message)
    })
  }

  this.removePlayer = function(curPlayer){
    this.players = this.players.filter(player => player != curPlayer)
    World.remove(this.world, curPlayer.ball)
    delete Player.all[curPlayer.id]
  }
}

function distanceBetween(vectorA, vectorB) {
  // Pythagorean theorem time
  return Math.sqrt(Math.pow(vectorA.x - vectorB.x, 2) + Math.pow(vectorA.y - vectorB.y, 2))
}
