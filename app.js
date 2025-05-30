var createError = require('http-errors');
var express = require('express');
var app = express();
const feedRouter = require('./routes/feed');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// TODO: 添加 API 路由
app.use('/api/feed', feedRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;
