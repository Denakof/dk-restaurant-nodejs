'use strict';

module.exports = (error , req , res , next) => {
  res.status(403).send({
    error: 403,
    route: req.path,
    message: `Forbidden - ${error}`,
  });
};