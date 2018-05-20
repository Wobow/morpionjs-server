import helpers from '../helpers';
import Lobby from '../models/lobbies';

export default {
  createLobby(user, newLobby) {
    return helpers
      .isNotInLobby(user._id)
      .then(() => helpers.hasNotAlreadyCreatedLobby(user._id))
      .then(() => {
        const lobby = new Lobby(newLobby);
        lobby.creator = user._id;
        return lobby.save();
      });
  },

  deleteLobby(user, lobbyId) {
    return helpers
      .userIsCreatorOfLobby(user._id, lobbyId)
      .then(lobby => Lobby.findByIdAndRemove(lobby._id));
  },
};
