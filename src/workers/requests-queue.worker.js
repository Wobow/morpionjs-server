
import { Observable, Subject } from 'rxjs';
import _ from 'lodash';
import RequestBean from '../beans/request.beans';
import { wrapInPromise } from '../helpers';

export default {
  queue: [],
  queue$: new Subject(),
  /**
   *
   * @param {Request} request
   */
  push(request) {
    this.queue$.next(JSON.parse(JSON.stringify(request)));
  },

  getQueue() {
    return this.queue;
  },

  pullRequest(requestId) {
    _.pullAllBy(this.queue, q => q._id === requestId);
  },

  process() {
    this.queue$
      .do(request => this.queue.push(request))
      .flatMap(request => Observable
        .fromPromise(this.treat(request))
        .combineLatest(Observable.of(request)))
      .subscribe((responsePayload) => {
        this.pullRequest(responsePayload[1]._id);
      });
  },

  treat(request) {
    switch (request.type) {
      case 'joinLobby':
        return RequestBean.joinLobby(request);
      case 'createGame':
        return RequestBean.createGame(request);
      case 'joinGame':
        return RequestBean.joinGame(request);
      case 'leaveLobby':
        return RequestBean.leaveLobby(request);
      case 'leaveGame':
        return RequestBean.leaveGame(request);
      default:
        return wrapInPromise(RequestBean.throwError('rejected', 'Unknown request type', request));
    }
  },
};
