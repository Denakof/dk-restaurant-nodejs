'use strict';

module.exports = (req, res, next) => {
    const err = {
        status: 404,
        route: req.path,
        message: 'Sorry, we could not find what you were looking for 😱'
    }
    res.status(404).json(err);
}