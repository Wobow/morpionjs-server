export default class RequestResponse {
  /**
   * Instantiates a new response for the requests
   *
   * @param {string} requestId The id of the request it is attached to
   * @param {string} message The message to display
   * @param {number} statusCode The code of the response as defined in the doc
   * @param {'rejected'|'ok'|'aborted'} status The human readable status
   * @param {string} resourceURI URI to the concerned resource
   */
  constructor(requestId, message, statusCode, status, resourceURI) {
    this.requestId = requestId;
    this.message = message;
    this.statusCode = statusCode;
    this.status = status;
    this.resourceURI = resourceURI;
    this.time = Date.now();
    this.type = 'user';
  }
}
