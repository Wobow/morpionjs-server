import mongoose from 'mongoose';

const WINNING_ROWS = [7, 56, 448, 73, 146, 292, 273, 84];

const gamesSchema = mongoose.Schema({
  lobby: {type: mongoose.SchemaTypes.ObjectId, ref: 'Lobby'},
  players: [{
    user: {type: mongoose.SchemaTypes.ObjectId, ref: 'User'},
    secret: String,
    winner: {type: Boolean, default: false}
  }],
  spectators: [{type: mongoose.SchemaTypes.ObjectId, ref: 'User'}],
  winner: {type: mongoose.SchemaTypes.ObjectId, ref: 'User'},
  draw: {
    type: Boolean,
    default: false
  },
  status: 'created'|'started'|'ended',
  turn: {type: mongoose.SchemaTypes.ObjectId, ref: 'User'},
  moves: Array,
  grid: Number
});

export const play = (game, move) => {
  game.moves.push(move);
  game.grid = game.grid | move;
  const turnIndex = game.players.findIndex((p) => game.turn.toString() === p.user.toString());
  const subGrid = game.moves.reduce((prev, cur, idx) => idx % 2 === (game.moves.length - 1) % 2 ? prev + cur : prev);
  if (WINNING_ROWS.find((r) => (subGrid & r) === r)) {
    game.players[turnIndex].winner = true;
    game.winner = game.turn;
    game.turn = null;
    game.status = 'ended';
  } else if (game.grid === 511) {
    game.draw = true;
    game.turn = null;
    game.status = 'ended';
  } else { 
    game.turn = game.players[-turnIndex + 1].user;
  }
  return game.save();
}

export const serializeGame = (game, req) => {
  game.players.forEach((player) => {
    if (!req || !req.user || player.user.toString() !== req.user._id.toString()) {
      player.secret = null;
    }
  });
  return game;
}

export const serializeGames = (games, req) => {
  games.forEach((game) => game = serializeGame(game));
  return games;
}

export const generateGameSecret = () => {
  return Math.random().toString(36).substr(2, 5);
}

export default mongoose.model('Game', gamesSchema);