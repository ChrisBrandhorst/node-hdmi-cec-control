'use strict'

const Proto   = require('./proto'),
      parsers = {}

module.exports = {

  types: {
    Debug:    "DEBUG",
    Notice:   "NOTICE",
    Traffic:  "TRAFFIC",
    Warning:  "WARNING"
  },

  //
  parse: function(message, controller) {
    var parts = message.match(/^([A-Z]+):\s*\[\s*(\d+)\]\s(<<|>>)?\s?(.*)$/)

    if (!parts) {
      controller.emit('message.error.format', message)
      return
    }

    var msg = {
      raw:        message,
      type:       parts[1],
      seq:        parts[2],
      incoming:   parts[3] != "<<",
      content:    parts[4]
    }

    var ps = parsers[msg.type]
    if (!ps) {
      controller.emit('message.error.parser', msg)
      return
    }

    var parser = null
    switch (msg.type) {

      case "TRAFFIC":
        var frame       = msg.frame = msg.content.toUpperCase().split(":")
        msg.header      = frame.shift(),
        msg.opcode      = frame.shift()
        msg.source      = Proto.Device[ msg.header[0] ]
        msg.destination = Proto.Device[ msg.header[1] ]
        msg.type        = Proto.MessageType[ msg.opcode ] || Proto.MessageType.PollingMessage
        parser = ps[msg.type.id]
        break

      case "DEBUG":
        for (var match in ps) {
          if (msg.content.match(match)) {
            parser = ps[match]
            break
          }
        }
        break

    }

    if (!parser) {
      controller.emit('message.error.parser', msg)
      return
    }

    controller.emit('message.parse', msg)
    var ret = parser(msg, controller)
    controller.emit('message.parsed', msg, ret)
  },

  //
  addParser(type, match, proc) {
    parsers[type] = parsers[type] || {}
    if (match.id) match = match.id
    parsers[type][match] = proc
  }

}