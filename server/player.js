//temp
import User from "../db/schema.js";
import Game from "./game.js";

let count = 0

export default class Player {

  constructor(socket) {
    this.id = count
    this.socket = socket
    this.potted = false
    this.shots = 0

    Player.all[this.id] = this
    count++
  }
  
  get game() {
    return Game.all[this.gameId]
  }

  playerName(){
    return this.name ? this.name : this.id
  }

  joinGame(){
    const game = Game.findOrCreateGame()
    this.gameId = game.id
    this.ball = game.createBall()

    game.players.push(this)

    this.socket.emit('initPlayer', {playerId: this.playerName(), hole: game.map.hole, mapObjects: game.map.mapObjects, messages: game.messages})
  }

  reset(){
    this.potted = false
    this.shots = 0
  }

  disconnect(){
    delete Player.all[this.id] // Are we deleting the instance
  }
}

Player.all = {}

Player.onConnect = (socket) => {
  const player = new Player(socket)

  player.joinGame()

  socket.on('mouseClick', (packet) => {
    if (player.ball.speed < 0.1) {
      player.shots++
      player.game.mouseClicked(player.ball, packet)
    }
  })

  socket.on('playAgain', () => {
    const player = Player.getPlayerBySocketId(socket.id)
    
    player.reset()
    player.joinGame()
  })

  socket.on('login', (name) => {
    const player = Player.getPlayerBySocketId(socket.id)

    User.find({name: name}, function(err, user){
      if(err) throw err

      if(user.length > 0){
        player.name = user[0].name
        socket.emit('successfulLogin', {
          name: player.name
        })
      } else {
        const playerToSave = new User({
          name: name
        })

        playerToSave.save(function(err, user){
          if(err) throw err
          player.name = user.name
          socket.emit('successfulLogin', {
            name: player.name
          })
        })
      }
    })
  })

  return player
}

Player.getPlayerBySocketId = function(socketId){
  for(const playerId in Player.all){
    if(Player.all[playerId].socket.id === socketId){
      return Player.all[playerId]
    }
  }
}

Player.handleDisconnect = function(socketId){
  const player = this.getPlayerBySocketId(socketId)
  player.game && player.game.removePlayer(player)
  player.disconnect()
}

