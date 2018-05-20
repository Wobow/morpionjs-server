import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
  hash: String,
  salt: String,
  modificationDate: Date,
  creationDate: Date,
  lobby: { type: mongoose.SchemaTypes.ObjectId, ref: 'Lobby' },
  game: { type: mongoose.SchemaTypes.ObjectId, ref: 'Game' },
});

userSchema.plugin(passportLocalMongoose);

userSchema.pre('update', () => {
  this.modificationDate = Date.now();
});
export default mongoose.model('User', userSchema);
