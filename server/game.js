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

    Engine.run(engine)
    const static = {isStatic: true}
    const topWall = Bodies.rectangle(400 / 2, 0 - 25, 400, 50, static),
      bottomWall = Bodies.rectangle(400 / 2, 600 + 25, 400, 50, static),
      leftWall = Bodies.rectangle(0 - 25, 600 / 2, 50, 600, static),
      rightWall = Bodies.rectangle(400 + 25, 600 / 2, 50, 600, static)
    const bodies = [topWall, bottomWall, leftWall, rightWall]
    bodies.forEach(body => body.restitution =0.6)
    World.add(this.world, bodies)

    // function updateMatter(){
    //   Matter.Events.trigger(engine, 'tick', { timestamp: engine.timing.timestamp })
    //   Matter.Engine.update(engine, engine.timing.delta)
    //   Matter.Events.trigger(engine, 'afterTick', { timestamp: engine.timing.timestamp })
    // }
  }

  this.run = () => {
    setInterval(() => {
      
      const pack = []
      for (const playerId in Player.all) {
        const player = Player.all[playerId]
        const ballPos = player.ball.position
        pack.push(ballPos)
        checkIfWin(player.ball)
      }
      sendPackets(pack)
    }, 1000/25)



    function sendPackets(pack){
      for(const playerId in Player.all){
        const player = Player.all[playerId]
        player.socket.emit('ballPositions', pack)
      }
    }
  }

  this.createBall = () => {
    const ball = Bodies.circle(300, 300, 15)
    World.add(this.world, ball)
    return ball
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
}



function distanceBetween(vectorA, vectorB) {
  // Pythagorean theorem time
  return Math.sqrt(Math.pow(vectorA.x - vectorB.x, 2) + Math.pow(vectorA.y - vectorB.y, 2))
}

function checkIfWin(ball){
  if(distanceBetween(ball.position, {x:200,y:50}) < 20 && ball.speed < 3){
    console.log("YP WONW")
  }
}