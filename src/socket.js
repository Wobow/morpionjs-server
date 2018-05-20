
import SocketIo from 'socket.io';
import Game, { serializeGame, play } from './models/games';
import User from './models/users';

export default {


  start(server) {
    this.io = SocketIo(server);
    this.io.on('connection', (socket) => {
      socket.on('joinGame', async (data) => {
        if (!data.gameId) {
          return socket.error({ message: 'You need to provide a game id' });
        }
        const game = await Game.findById(data.gameId);
        if (!game) {
          return socket.error({ message: 'This game does not exist' });
        }
        socket.join(data.gameId);
        socket.broadcast.to(data.gameId).emit('message', { message: 'A player connected to the game', data: serializeGame(game) });
        return socket.emit('message', { message: 'You joined the game', data: serializeGame(game) });
      });

      socket.on('playTurn', async (data) => {
        try {
          if (!data.gameId) {
            return socket.error({ message: 'You must provide a game id' });
          }
          if (!data.secret) {
            return socket.error({ message: 'You must provide a secret' });
          }
          if (!data.move) {
            return socket.error({ message: 'You must provide a move' });
          }
          let game = await Game.findById(data.gameId);
          if (!game) {
            return socket.error({ message: 'This game does not exist' });
          }
          if (game.status === 'ended') {
            return socket.error({ message: 'This game is already finished ' });
          }
          if (game.players.length !== 2) {
            return socket.error({ message: 'You must wait for another player' });
          }
          const player = game.players.find(p => p.secret === data.secret);
          if (!player) {
            return socket.error({ message: 'Secret is invalid' });
          }
          if (player.user.toString() !== game.turn.toString()) {
            return socket.error({ message: 'It is not your turn' });
          }
          const move = parseInt(data.move, 10);
          if (Number.isNaN(move) ||
              game.grid & move ||
              [1, 2, 4, 8, 16, 32, 64, 128, 256].indexOf(data.move) === -1) {
            return socket.error({ message: 'Move is not valid' });
          }
          game = await play(game, move);
          socket.emit('turn', { message: 'Move played', data: serializeGame(game) });
          socket.broadcast.to(data.gameId).emit('turn', { message: 'Turn played', data: serializeGame(game) });
          if (game.status === 'ended') {
            if (game.winner) {
              const winner = await User.findById(game.winner);
              socket.emit('message', { message: `${winner.username} won the game !`, data: serializeGame(game), finished: true });
              socket.broadcast.to(data.gameId).emit('message', { message: `${winner.username} won the game !`, data: serializeGame(game), finished: true });
            } else if (game.draw) {
              socket.emit('message', { message: 'It\'s a draw !', data: serializeGame(game), finished: true });
              socket.broadcast.to(data.gameId).emit('message', { message: 'It\'s a draw !', data: serializeGame(game), finished: true });
            } else {
              socket.emit('message', { message: 'The game has ended !', data: serializeGame(game), finished: true });
              socket.broadcast.to(data.gameId).emit('message', { message: 'The game has ended', data: serializeGame(game), finished: true });
            }
          }
          return true;
        } catch (err) {
          socket.error({ message: 'Internal Server Error', stack: err });
          return false;
        }
      });
    });
  },
};
