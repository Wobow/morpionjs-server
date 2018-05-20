import mongoose from 'mongoose';

const requestSchema = mongoose.Schema({
  author: mongoose.SchemaTypes.ObjectId,
  date: mongoose.SchemaTypes.Date,
  type: String,
  response: String,
  status: String,
  accessResource: mongoose.SchemaTypes.ObjectId,
});

export default mongoose.model('Request', requestSchema);
