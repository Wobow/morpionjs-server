
import _ from 'lodash';
import User from '../models/users';

export const USER_JOINED_LOBBY = (user, lobbyID) => ({type: 'lobby', action: 'joined', lobbyID, user, time: Date.now()});
export const USER_LEFT_LOBBY = (user, lobbyID) => ({type: 'lobby', action: 'leave', lobbyID, user, time: Date.now()});
export const USER_CREATED_GAME = (user, gameID) => ({type: 'game', action: 'created', gameID, user, time: Date.now()});
export const USER_JOINED_GAME = (user, gameID) => ({type: 'game', action: 'joined', gameID, user, time: Date.now()});
export const USER_LEFT_GAME = (user, gameID) => ({type: 'game', action: 'leave', gameID, user, time: Date.now()});

export default {

  connections: {},

  /**
   * 
   * @param {*} ws 
   * @param {*} msg 
   * @param {*} todelete 
   */
  send(ws, msg, todelete = null) {
    try {
      ws.send(msg);
    } catch (err) {
      if (todelete && this.connections[todelete.userID] && this.connections[todelete.userID].length >= todelete.idx) {
        console.log('connection deleted');
        _.pullAt(this.connections[todelete.userID], todelete.idx);
      }
    }
  },

  /**
   * 
   * @param {*} userID 
   * @param {*} objToSend 
   */
  notifyUser(userID, objToSend) {
    if (!this.connections[userID] || !this.connections[userID].length) {
      console.log('No socket to use');
      return;
    }
    this.connections[userID].forEach((ws, idx) => {
      this.send(ws, JSON.stringify(objToSend), {userID, idx});
    });
  },

  /**
   * 
   * @param {*} userList 
   * @param {*} objToSend 
   */
  notifyUserList(userList, objToSend) {
    userList.forEach((user) => {
      this.notifyUser(user._id, objToSend);
    });
  },

  /**
   * 
   * @param {*} lobbyId 
   * @param {*} objToSend 
   */
  async notifyLobby(lobbyId, objToSend) {
    this.notifyUserList(await User.find({lobby: lobbyId}), objToSend);
  },

  /**
   * 
   * @param {*} gameId 
   * @param {*} objToSend 
   */
  async notifyGame(gameId, objToSend) {
    this.notifyUserList(await User.find({game: gameId}), objToSend);
  },

  /**
   * 
   * @param {*} content 
   * @param {*} ws 
   */
  async subscribe(content, ws) {
    const user = await User.findById(content.userId)
    if (!user) {
      return SocketWorker.send(ws, 'No such user');
    }
    if (!this.connections[content.userId]) {
      this.connections[content.userId] = [];
    }
    this.connections[content.userId].push(ws);
    this.send(ws, 'ok');
    console.log('User subscribed a socket');
  },
};