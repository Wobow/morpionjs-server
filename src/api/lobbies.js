import resource from 'resource-router-middleware';
import User from '../models/users';
import APIError from '../error';
import express from 'express';
import helpers from '../helpers';
import Lobby from '../models/lobbies';
import LobbyBean from '../beans/lobbies.beans';
import Game, { serializeGames } from '../models/games';

const router = express.Router();

export const lobbies = ({ config, db }) => {
  
  router.get('/', (req, res, next) => {
    Lobby
      .find({})
      .skip(parseInt(req.query.offset) || 0)
      .limit(parseInt(req.query.limit) || 10)
      .then((lobbies) => res.json(lobbies))
      .catch((err) => next(APIError.from(err, 'Could not retrieves lobbies', 500)));
  });

  router.get('/:id', (req, res, next) => {
    Lobby
      .findById(req.params.id)
      .populate('users')
      .then((lobby) => {
        if (!lobby) {
          throw new APIError('Lobby not found', null, 404);
        }
        res.json(lobby)
      })
      .catch((err) => next(APIError.from(err, 'Could not retrieves lobbies', 500)));
  });

  router.get('/:id/members', (req, res, next) => {
    User.find({lobby: req.params.id})
      .then((users) => {
        if (!users) {
          throw new APIError('Lobby not found', null, 404);
        }
        res.json(users);
      })
      .catch((err) => next(APIError.from(err, 'Could not retrieves members of lobby', 500)));
  });

  router.get('/:id/games', (req, res, next) => {
    Game.find({lobby: req.params.id})
      .then((games) => {
        if (!games) {
          throw new APIError('Lobby not found', null, 404);
        }
        res.json(serializeGames(games));
      })
      .catch((err) => next(APIError.from(err, 'Could not retrieves games of lobby', 500)));
  });

  router.post('/', (req, res, next) => {
    helpers.checkBody(req.body, ['name']);
    LobbyBean
      .createLobby(req.user, req.body)
      .then((lobby) => {
        return res.json(lobby);
      })
      .catch((err) => next(APIError.from(err, null)));
  });

  router.delete('/:id', (req, res, next) => {
    LobbyBean
      .deleteLobby(req.user, req.params.id)
      .then((lobby) => {
        return res.status(204).send();
      })
      .catch((err) => next(APIError.from(err, null)));
  });

  return router;
};


export default lobbies;