'use strict';

module.exports = (error , req , res , next) => {
  res.status(401).send({
    error: 401,
    route: req.path,
    message: `Unauthorized - ${error}`,
  });
};