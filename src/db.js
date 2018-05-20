import mongoose from 'mongoose';
import config from './config';

export default (callback) => {
  mongoose.connect(config.mongoDB);
  const db = mongoose.connection;
  db.once('open', () => {
    callback(db);
  });
};
