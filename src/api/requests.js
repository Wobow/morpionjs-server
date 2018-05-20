import express from 'express';
import APIError from '../error';
import helpers from '../helpers';
import Request from '../models/requests';
import RequestBean from '../beans/request.beans';

const router = express.Router();

export const requests = () => {
  router.get('/:rid', (req, res, next) => {
    Request.findOne({
      _id: req.params.id,
      author: req.user.id,
    })
      .then((request) => {
        if (!request) {
          throw new APIError('Request not found, or you do not have permission to access', null, 404);
        }
        return res.json(request);
      })
      .catch(err => next(APIError.from(err, 'Request not found', 404)));
  });

  router.post('/', (req, res, next) => {
    helpers.checkBody(req.body, ['type', 'accessResource']);
    RequestBean.checkType(req.body.type);
    const newRequest = new Request(req.body);
    newRequest.author = req.user.id;
    newRequest.data = Date.now();
    newRequest.status = 'submitted';
    newRequest
      .save()
      .then(request => RequestBean.treatRequest(request))
      .then((response) => {
        res.json(response);
      })
      .catch(err => next(APIError.from(err, 'Could not process request', 400)));
  });

  return router;
};


export default requests;
