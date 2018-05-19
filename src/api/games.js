import resource from 'resource-router-middleware';
import User from '../models/users';
import APIError from '../error';
import express from 'express';
import helpers from '../helpers';
import Lobby from '../models/lobbies';
import LobbyBean from '../beans/lobbies.beans';
import Game, { serializeGame, serializeGames } from '../models/games';

const router = express.Router();

export const games = ({ config, db }) => {
  
  router.get('/', (req, res, next) => {
    Game
      .find({})
      .skip(parseInt(req.query.offset) || 0)
      .limit(parseInt(req.query.limit) || 10)
      .then((games) => res.json(serializeGames(games, req)))
      .catch((err) => next(APIError.from(err, 'Could not retrieves Games', 500)));
  });

  router.get('/:id', (req, res, next) => {
    Game
      .findById(req.params.id)
      .populate('players lobby turn')
      .then((game) => {
        if (!game) {
          throw new APIError('Game not found', null, 404);
        }
        res.json(serializeGame(game, req))
      })
      .catch((err) => next(APIError.from(err, 'Could not retrieves game', 500)));
  });

  return router;
};


export default games;