"use strict";

var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var redis = require('redis');
var redisClient;

/** Используем файловый логгер: */
var accessLogStream = fs.createWriteStream(__dirname + '/logs/node-app.log', {flags: 'a'})
app.use(morgan('combined', {stream: accessLogStream}));

/** Для темплейтов используем jade: */
app.set('views', __dirname + '/src/views');
app.set('view engine', 'jade');

/** Немного настроек: */
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/** Подключаем moment.js */
app.locals.moment = require('moment');
app.locals.moment.locale('ru');

/** Прекомпиляция SCSS: */
app.use(require('node-sass-middleware')({
  src: __dirname + '/src',
  dest: __dirname + '/public',
  debug: true,
  outputStyle: 'compressed'
}));

app.use(require('express-coffee-script')({
  src: __dirname + '/src/coffee/',
  dest: __dirname + '/public/javascripts/',
  prefix: '/javascripts',
  debug: true,
  compilerOpts: { bare: true }
}));

/** Статику ищем в /public: */
app.use(express.static(__dirname + '/public'));

/** У нас разные настройки для Production и для Development: */
if (app.get('env') === 'production') {
  redisClient = redis.createClient("/tmp/redis.sock");
} else {
  redisClient = redis.createClient(6379, "127.0.0.1");
}

app.locals.redis = redisClient;

/** GET / - стартовая страница: */
app.get('/', function(req, res, next) {

  /** Получаем данные и формируем ответ сервера: */
  var messages = redisClient.lrange('messages', 0, 99, function(err, reply) {

    if (!err) {

      var result = [];

      /** Циклический обход списка с разбором каждого элемента в объект */
      for (var msg in reply) {
        if (!!reply[msg]) {
          result.push(JSON.parse(reply[msg]));
        }
      }

      /** Передача списка сообщений в представление */
      res.render('index', { messages: result });

    } else res.render('index', {messages: []});

  });

});

module.exports = app;
