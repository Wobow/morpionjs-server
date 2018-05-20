import express from 'express';
import User from '../models/users';
import APIError from '../error';
import helpers from '../helpers';

const router = express.Router();

export const users = () => {
  /** GET / - List all entities */
  router.get('/', (req, res, next) => {
    User
      .find()
      .then(loadedUsers => res.json(loadedUsers))
      .catch(err => next(new APIError('Cannot load user list', err, 500)));
  });

  /** GET /:id - List all entities */
  router.get('/:id', (req, res, next) => {
    User
      .findOne({ _id: req.params.id })
      .populate('lobby')
      .then((user) => {
        if (!user) { throw new APIError('User not found', null, 404); }
        res.json(user);
      })
      .catch(err => next(APIError.from(err, 'Cannot load user')));
  });

  /** PUT /:id - Updates one user */
  router.put('/:id', helpers.isConnectedUserPermissionHandler, (req, res, next) => {
    User
      .findOne({ _id: req.params.id })
      .then((user) => {
        const toSave = user;
        if (!user) throw new APIError('User not found', null, 404);
        Object.keys(req.body).forEach((key) => {
          if (key !== '_id') {
            toSave[key] = req.body[key];
            if (req.body[key] === 'undefined' && key !== 'username') {
              toSave[key] = undefined;
            }
          }
        });
        return toSave.save();
      })
      .then((user) => {
        res.status(200).json(user);
      })
      .catch(err => next(APIError.from(err, 'Cannot update user. ', 409)));
  });

  return router;
};

export default users;
