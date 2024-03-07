const jwt = require('jsonwebtoken');
const logger = require('./logger');
const User = require('../models/users');

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method);
  logger.info('Path:  ', request.path);
  logger.info('Body:  ', request.body);
  logger.info('---');
  next();
};

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

const tokenExtractor = async (request, response, next) => {
  let authorization = request.get('Authorization');

  if (authorization && authorization.startsWith('Bearer ')) {
    authorization = authorization.replace('Bearer ', '');
  }

  const decodedToken = jwt.verify(authorization, process.env.SECRET);

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' });
  }
  next();
};

const userExtractor = async (request, response, next) => {
  let authorization = request.get('Authorization');

  if (authorization && authorization.startsWith('Bearer ')) {
    authorization = authorization.replace('Bearer ', '');
  }

  const decodedToken = jwt.verify(authorization, process.env.SECRET);

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' });
  }

  request.user = await User.findById(decodedToken.id);
  next();
};

// eslint-disable-next-line consistent-return
const errorHandler = (error, request, response, next) => {
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' });
  } if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  } if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({ error: 'expected `username` to be unique' });
  } if (error.name === 'jsonWebTokenError') {
    return response.status(400).json({ error: 'token missing or invalid' });
  } if (error.name === 'TokenExpiredError') {
    return response.status(401).json({ error: 'token expired' });
  }

  next(error);
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  userExtractor,
  tokenExtractor,
  errorHandler,
};
