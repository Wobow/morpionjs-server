import mongoose from 'mongoose';

const gamesSchema = mongoose.Schema({
  lobby: {type: mongoose.SchemaTypes.ObjectId, ref: 'Lobby'},
  players: [{type: mongoose.SchemaTypes.ObjectId, ref: 'User'}],
  spectators: [{type: mongoose.SchemaTypes.ObjectId, ref: 'User'}],
  status: 'created'|'started'|'ended',
  turn: {type: mongoose.SchemaTypes.ObjectId, ref: 'User'},
  moves: Array,
});

export default mongoose.model('Game', gamesSchema);