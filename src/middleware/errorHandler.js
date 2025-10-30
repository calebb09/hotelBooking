module.exports = {
  development: (err, req, res, next) => {
    const status = err.status || 500;
    res
      .status(status)
      .json({error: {status, type: err.name, message: err.message}, raw: err});
  },
  production: (err, req, res, next) => {
    const status = err.status || 500;
    res
      .status(status)
      .json({error: {status, type: err.name, message: err.message}});
  },
};
