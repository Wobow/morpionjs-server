import http from 'http';
import express from 'express';
import cors from 'cors';
import 'babel-polyfill';
import passport from 'passport';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import initializeDb from './db';
import middleware from './middleware';
import api from './api';
import config from './config';
import APIError from './error';
import initializePassport from './passport-init';
import requestsQueueWorker from './workers/requests-queue.worker';
import SocketHandler from './socket';

const app = express();


app.server = http.createServer(app);


// logger
app.use(morgan('dev'));

// 3rd party middleware
app.use(cors({
  exposedHeaders: config.corsHeaders,
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(passport.initialize());
initializePassport();
initializeDb((db) => {
  app.use(middleware());
  app.use('/api', api({ config, db }));

  app.use((error, req, res, next) => {
    APIError.from(error).send(res);
    next();
  });

  SocketHandler.start(app.server);
  requestsQueueWorker.process();

  app.server.listen(process.env.PORT || config.port, () => {});
});

export default app;
