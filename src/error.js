export default class APIError {
  /**
   * Creates an error object to be consistent thoughout the api
   * @param {string} message
   * @param {number} statusCode
   * @param {any} stack
   */
  constructor(message, stack = {}, statusCode = 500) {
    this.message = message;
    this.status = statusCode;
    this.stack = stack;
  }

  static from(error, defaultMsg = null, status = null) {
    let err;
    if (error instanceof APIError) {
      err = error;
    } else if (error && error instanceof Error) {
      err = new APIError(defaultMsg || error.message || 'Fatal Server Error', error.stack, error.status || 500);
    } else {
      err = new APIError(defaultMsg || 'Unknown error', error, 500);
    }
    if (status) {
      err.status = status;
    }
    return err;
  }

  send(res) {
    res.status(this.status);
    res.json({
      error: true,
      message: this.message || this.translateStatus(),
      status: this.status,
      stackTrace: this.stack,
    });
  }

  throw() {
    throw Object(this);
  }

  translateStatus() {
    switch (this.status) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 405:
        return 'Method Not Allowed';
      case 409:
        return 'Conflict';
      case 500:
        return 'Unknown Fatal Error';
      default:
        return 'Unknow Error';
    }
  }
}
