'use strict';

import RequestResponse from '../models/requestResponse';
import APIError from '../error';
import requestQueue from '../workers/requests-queue.worker';
import Lobby from '../models/lobbies';
import User from '../models/users';
import Game from '../models/games';
import SocketWorker, { USER_JOINED_GAME, USER_JOINED_LOBBY, USER_LEFT_GAME, USER_LEFT_LOBBY, USER_CREATED_GAME } from '../workers/web-sockets.worker';

export default {

  allowedTypes: ['joinGame', 'createGame', 'joinLobby', 'invitePlayer', 'leaveGame', 'leaveLobby'],
  /**
   * Verifies if a request type is valid
   * @param {string} type the type to check
   */
  checkType(type) {
    if (this.allowedTypes.findIndex((t) => t === type) === -1) {
      throw new APIError(`Type '${type}' is not a valid type. Type should be one of the following : ${this.allowedTypes.join(', ')}`, null, 400);
    }
  },

  /**
   * Will treat a request
   * @param {Request} request The request to treat
   * @returns {Promise} The response to the request
   */
  treatRequest(request) {
    if (request.status !== 'submitted') {
      reject(new RequestResponse(request._id, 'REQUEST_ALREADY_TREATED', 1));
    }
    return requestQueue.treat(request);
  },

  throwError(requestId, errorMessage, statusCode, status, resourceURI) {
    return new RequestResponse(requestId, errorMessage, statusCode, status, resourceURI);
  },

  async leaveLobby(request) {
    try {
      const user = await User.findById(request.author);
      if (!user) {
        return this.throwError(request._id, 'User not found', 1201, 'rejected', null);
      }
      if (!user.lobby) {
        return this.throwError(request._id, 'User is not in any lobby', 1204, null);
      }
      SocketWorker.notifyLobby(user.lobby, USER_LEFT_LOBBY(user, user.lobby));
      user.lobby = undefined;
      await user.save();
      return new RequestResponse(request._id, 'Lobby left', 102, 'ok', null);
    } catch (err) {
      console.error(err);
      return this.throwError(request._id, 'Internal Server Error', 1001, 'rejected', null);
    }
  },

  async leaveGame(request) {
    try {
      const user = await User.findById(request.author);
      if (!user) {
        return this.throwError(request._id, 'User not found', 1201, 'rejected', null);
      }
      if (!user.game) {
        return this.throwError(request._id, 'User is not in any game', 1304, null);
      }
      SocketWorker.notifyGame(user.lobby, USER_LEFT_GAME(user, user.game));
      user.game = undefined;
      await user.save();
      return new RequestResponse(request._id, 'Game left', 103, 'ok', null);
    } catch (err) {
      console.error(err);
      return this.throwError(request._id, 'Internal Server Error', 1001, 'rejected', null);
    }
  },

  async joinLobby(request) {
    try {
      const lobby = await Lobby.findById(request.accessResource)
      if (!lobby) {
        return this.throwError(request._id, 'Lobby not found', 1101, 'rejected', null);
      }
      const user = await User.findById(request.author);
      if (!user) {
        return this.throwError(request._id, 'User not found', 1201, 'rejected', null);
      }
      if (user.lobby) {
        return this.throwError(request._id, 'User is already in a lobby', 1202, 'rejected', `/api/lobbies/${user.lobby}`);
      }
      user.lobby = lobby;
      await user.save();
      SocketWorker.notifyLobby(lobby._id, USER_JOINED_LOBBY(user, lobby._id));
      return new RequestResponse(request._id, 'Lobby joined', 101, 'ok', `/api/lobbies/${lobby._id}`);
    } catch (err) {
      console.error(err);
      return this.throwError(request._id, 'Internal Server Error', 1001, 'rejected', null);
    }
  },
  
  async createGame(request) {
    try {
      const lobby = await Lobby.findById(request.accessResource);
      if (!lobby) {
        return this.throwError(request._id, 'Lobby not found', 1101, 'rejected', null);
      }
      const user = await User.findById(request.author);
      if (!user) {
        return this.throwError(request._id, 'User not found', 1201, 'rejected', null);
      }
      if (user.game) {
        return this.throwError(request._id, 'User is already in a game', 1203, 'rejected', `/api/games/${user.game}`);
      }
      if (!user.lobby || (user.lobby.toString() !== lobby._id.toString())) {
        return this.throwError(request._id, 'User is not in the requested lobby', 1204, 'rejected', null);
      }
      const game = await new Game({
        lobby,
        players: [user],
        status: 'created',
        moves: [],
      }).save();
      user.game = game;
      await user.save();
      SocketWorker.notifyGame(game._id, USER_CREATED_GAME(user, game._id));
      return new RequestResponse(request._id, 'Game created', 301, 'ok', `/api/games/${game._id}`);
    } catch (err) {
      console.error(err);
      return this.throwError(request._id, 'Internal Server Error', 1001, 'rejected', null);
    }
  },

  async joinGame(request) {
    try {
      const game = await Game.findById(request.accessResource);
      if (!game) {
        return this.throwError(request._id, 'Game not found', 1301, 'rejected', null);
      }
      if (game.players && game.players.length > 1) {
        return this.throwError(request._id, 'Game is already full', 1303, 'rejected', null);
      }
      if (game.status !== 'created' && game.players.findIndex((id) => request.author === id) === -1) {
        return this.throwError(request._id, 'Game has already started', 1302, 'rejected', null);
      }
      const user = await User.findById(request.author);
      if (!user) {
        return this.throwError(request._id, 'User not found', 1201, 'rejected', null);
      }
      if (game.players && game.players.findIndex((u) => u === user._id.toString()) > -1) {
        return this.throwError(request._id, 'User is already in this game', 1205, 'rejected', `/api/games/${user.game}`);
      }
      if (!user.lobby || user.lobby.toString() !== game.lobby.toString()) {
        return this.throwError(request._id, `User is not in the game's lobby`, 1304, 'rejected', `/api/lobbies/${game.lobby}`);
      }
      if (user.game) {
        return this.throwError(request._id, 'User is already in a game', 1203, 'rejected', `/api/games/${user.game}`);
      }
      game.players.push(user);
      user.game = game;
      await game.save();
      await user.save();
      SocketWorker.notifyGame(game._id, USER_JOINED_GAME(user, game._id));
      return new RequestResponse(request._id, 'Joined game', 302, 'ok', `/api/games/${game._id}`);
    } catch (err) {
      console.error(err);
      return this.throwError(request._id, 'Internal Server Error', 1001, 'rejected', null);
    }
  }  
}