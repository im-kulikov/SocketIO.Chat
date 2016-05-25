"use strict";
$.cookie = function(name, value, options) {
  var cookie, cookieValue, cookies, date, domain, expires, i, len, path, secure;
  if (typeof value !== 'undefined') {
    options = options || {};
    if (value === null) {
      value = "";
      options.expires = -1;
    }
    expires = "";
    if (options.expires && (typeof options.expires === 'number' || options.expires.toUTCString)) {
      if (typeof options.expires === "number") {
        date = new Date;
        date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
      } else {
        date = options.expires;
      }
      expires = "; expires=" + (date.toUTCString());
    }
    path = options.path ? "; path=" + options.path : "";
    domain = options.domain ? "; domain=" + options.domain : "";
    secure = options.secure ? "; secure=" + options.secure : "";
    return document.cookie = [name, "=", encodeURIComponent(value), expires, path, domain, secure].join("");
  } else {
    cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      cookies = document.cookie.split(";");
      for (i = 0, len = cookies.length; i < len; i++) {
        cookie = cookies[i];
        cookie = jQuery.trim(cookie);
        if (cookie.substring(0, name.length + 1) === (name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
};

$(document).ready(function() {
  var fields, msgList, newMessage, nickname, scrollToEnd, socket, submitForm;
  socket = io();
  nickname = '';
  msgList = $('.messages');
  fields = {
    nickname: $('#name'),
    message: $('#message')
  };
  fields.message.focus();
  scrollToEnd = function() {
    return $(".messages").animate({
      "scrollTop": $('.messages__item').length * 100
    }, 10);
  };
  scrollToEnd();
  newMessage = function(data) {
    var _msg, _when, _who, li;
    if (!!data.date) {
      data.date = new Date(data.date);
    } else {
      data.date = new Date();
    }
    _who = $('<span class="message__name">').text(data.name);
    _when = $('<span class="message__date">').text(moment(data.date).calendar());
    _msg = $('<span class="message__content">').text(data.message);
    li = $('<li class="messages__item message">').append(_who).append(_when).append(_msg);
    msgList.append(li);
    return scrollToEnd();
  };
  submitForm = function(event) {
    var data;
    data = {
      message: fields.message.val(),
      name: fields.nickname.val(),
      date: new Date()
    };
    fields.message.val('');
    event.preventDefault();
    socket.emit('new message', data);
    return fields.message.focus();
  };
  $('.form').on('submit', submitForm);
  if ('localStorage' in window && localStorage.getItem('nickname')) {
    nickname = localStorage.getItem('nickname');
  } else if ($.cookie('nickname')) {
    nickname = $.cookie('nickname');
  } else {
    nickname = prompt('Please enter your nickname');
  }
  if ('localStorage' in window) {
    localStorage.setItem('nickname', nickname);
  }
  $('#name').val(nickname);
  $.cookie('nickname', nickname);
  socket.emit('join', nickname);
  return socket.on('new message', function(data) {
    return newMessage(data);
  });
});
