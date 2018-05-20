
import { Router } from 'express';
import passport from 'passport';
import auth from './auth';
import * as UserResources from './users';

import { version } from '../../package.json';
import { requests } from './requests';
import { lobbies } from './lobbies';
import { games } from './games';

export default ({ config, db }) => {
  const api = Router();

  api.use('/auth', auth({ config, db }));
  api.use('/requests', passport.authenticate('jwt', { session: false }), requests({ config }));
  api.use('/users', passport.authenticate('jwt', { session: false }), UserResources.users({ config }));
  api.use('/lobbies', passport.authenticate('jwt', { session: false }), lobbies({ config }));
  api.use('/games', passport.authenticate('jwt', { session: false }), games());


  api.get('/', (req, res) => {
    res.json({ version });
  });

  return api;
};
