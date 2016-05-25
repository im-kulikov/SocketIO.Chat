"use strict"

# This code is originally taken from the jQuery Cookie plugin by carhartl
# http://plugins.jquery.com/node/1387
#
# Rewritten in CoffeeScript by Bodacious on 23rd June 2011 for http://urtv.co.uk
$.cookie = (name, value, options) ->
  if typeof value != 'undefined'
    options = options || {}
    if value == null
      value = ""
      options.expires = -1
    expires = ""
    if options.expires and (typeof options.expires == 'number' or options.expires.toUTCString)
      if typeof options.expires == "number"
        date = new Date
        date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000))
      else
        date = options.expires
      # use expires attribute, max-age is not supported by IE
      expires = "; expires=#{date.toUTCString()}"
    path = if options.path then "; path=#{(options.path)}" else ""
    domain = if options.domain then "; domain=#{options.domain}" else ""
    secure = if options.secure then "; secure=#{options.secure}" else ""
    document.cookie = [name, "=", encodeURIComponent(value), expires, path, domain, secure].join("")
  else # only name given, get cookie
    cookieValue = null
    if document.cookie and document.cookie != ""
      cookies = document.cookie.split(";")
      for cookie in cookies
        cookie = jQuery.trim(cookie)
        if cookie.substring(0, (name.length + 1)) == ("#{name}=")
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
          break
    # return the value of cookieValue
    cookieValue

$(document).ready ->
  socket = io()
  nickname = ''
  msgList = $('.messages')
  fields =
    nickname: $('#name')
    message: $('#message')

  fields.message.focus()

  scrollToEnd = ->
    $(".messages").animate({"scrollTop":$('.messages__item').length * 100},10)

  scrollToEnd()

  # Добавляем новое сообщение в чат:
  newMessage = (data) ->
    if !!data.date
      data.date = new Date(data.date)
    else
      data.date = new Date()

    _who  = $('<span class="message__name">').text(data.name)
    _when = $('<span class="message__date">').text(moment(data.date).calendar())
    _msg  = $('<span class="message__content">').text(data.message)
    li = $('<li class="messages__item message">').append(_who).append(_when).append(_msg)

    msgList.append li

    scrollToEnd()

  submitForm = (event) ->
    # Собираем данные:
    data =
      message:  replaceURLWithHTMLLinks(fields.message.val())
      name: fields.nickname.val()
      date: new Date()

    # Очищаем поля:
    fields.message.val('')

    # Останавливаем последующую обработку:
    event.preventDefault()

    # Отправляем сообщение:
    socket.emit('new message', data)

    # Добавить сообщение на страницу
#    newMessage(data);

    # Возобновляем фокус:
    fields.message.focus()

  # Находим ссылки в тексте
  replaceURLWithHTMLLinks = (text) ->
    exp = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/

    lowercase = text.toLowerCase()
    parts = lowercase.match(exp)

    if $.isArray(parts) == true
      return lowercase.replace exp, '~ я дурак и меня нужно забанить ~'
    else
      return text

  # Меняем имя:
  changeName = (name)->
    if 'localStorage' of window
      localStorage.setItem 'nickname', name

    if nickname != name
      socket.emit('change name', name);

    nickname = name
    fields.nickname.val(name)
    $.cookie('nickname', name)

  # Вешаем событие на изменение ника:
  fields.nickname.on('change', (event)->
    event.preventDefault()

    changeName(this.value)
  )

  # Вешаем событие на форму:
  $('.form').on 'submit', submitForm

  if 'localStorage' of window and localStorage.getItem('nickname')
    nickname = localStorage.getItem('nickname')
  else if $.cookie('nickname')
    nickname = $.cookie('nickname')
  else
    nickname = prompt('Введите ваше имя!')

  if !nickname
    nickname = 'UserName' + (new Date()).getUTCMilliseconds()

  changeName(nickname)

  # Отправить сообщение на сервер, к которому подключен пользователь
  socket.emit('join', nickname);

  # Получение сообщения:
  socket.on 'new message', (data)->
    # Добавить сообщение на страницу
    newMessage(data);


