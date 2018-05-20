import express from 'express';
import APIError from '../error';
import Game, { serializeGame, serializeGames } from '../models/games';

const router = express.Router();

export const games = () => {
  router.get('/', (req, res, next) => {
    Game
      .find({})
      .skip(parseInt(req.query.offset, 10) || 0)
      .limit(parseInt(req.query.limit, 10) || 10)
      .then(loadedGames => res.json(serializeGames(loadedGames, req)))
      .catch(err => next(APIError.from(err, 'Could not retrieves Games', 500)));
  });

  router.get('/:id', (req, res, next) => {
    Game
      .findById(req.params.id)
      .populate('players lobby turn')
      .then((game) => {
        if (!game) {
          throw new APIError('Game not found', null, 404);
        }
        res.json(serializeGame(game, req));
      })
      .catch(err => next(APIError.from(err, 'Could not retrieves game', 500)));
  });

  return router;
};


export default games;
