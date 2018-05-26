import mongoose from 'mongoose';

const WINNING_ROWS = [7, 56, 448, 73, 146, 292, 273, 84];

const gamesSchema = mongoose.Schema({
  lobby: { type: mongoose.SchemaTypes.ObjectId, ref: 'Lobby' },
  players: [{
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    secret: String,
    winner: { type: Boolean, default: false },
  }],
  spectators: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
  winner: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  draw: {
    type: Boolean,
    default: false,
  },
  status: String,
  turn: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  moves: Array,
  grid: Number,
});

export const play = (game, move) => {
  const gameToSave = game;
  game.moves.push(move);
  gameToSave.grid |= move;
  const turnIndex = game.players.findIndex(p => game.turn.toString() === p.user.toString());
  let subGrid = 0;
  for (let i = 0; i < game.moves.length; i += 1) {
    if (i % 2 === (game.moves.length % 2) - 1) {
      subGrid += game.moves[i];
    }
  }
  if (WINNING_ROWS.find(r => (subGrid & r) === r)) {
    gameToSave.players[turnIndex].winner = true;
    gameToSave.winner = game.turn;
    gameToSave.turn = null;
    gameToSave.status = 'ended';
  } else if (game.grid === 511) {
    gameToSave.draw = true;
    gameToSave.turn = null;
    gameToSave.status = 'ended';
  } else {
    gameToSave.turn = game.players[-turnIndex + 1].user;
  }
  return gameToSave.save();
};

export const serializeGame = (game, req) => {
  const gameToMod = game;
  gameToMod.players.forEach((player, idx) => {
    if (!req || !req.user || player.user.toString() !== req.user._id.toString()) {
      gameToMod.players[idx].secret = null;
    }
  });
  return gameToMod;
};

export const serializeGames = (games, req) => {
  const gamesToMod = games;
  gamesToMod.forEach((game, idx) => { gamesToMod[idx] = serializeGame(game, req); });
  return gamesToMod;
};

export const generateGameSecret = () => Math.random().toString(36).substr(2, 5);

export default mongoose.model('Game', gamesSchema);
