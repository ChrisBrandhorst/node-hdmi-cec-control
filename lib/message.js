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
  parse: function(message) {
    var parts = message.match(/^([A-Z]+):\s*\[\s*(\d+)\]\s(<<|>>)?\s?(.*)$/)

    if (!parts)
      throw new Error("Unknown message format: " + message)

    var obj = {
      raw:      message,
      type:     parts[1],
      seq:      parts[2],
      dir:      parts[3],
      content:  parts[4]
    }

    var ps = parsers[obj.type]
    if (!ps)
      throw new Error("No parsers for message type: " + obj.type)

    var parser = null
    switch (obj.type) {

      case "TRAFFIC":
        var frame       = obj.frame = obj.content.toUpperCase().split(":")
        obj.header      = frame.shift(),
        obj.opcode      = frame.shift()
        obj.source      = Proto.Devices[ obj.header[0] ]
        obj.destination = Proto.Devices[ obj.header[1] ]
        obj.messageType = Proto.MessageTypes[ obj.opcode ] || Proto.MessageTypes.PollingMessage
        parser = ps[obj.messageType.id]
        break

      case "DEBUG":
        for (var match in ps) {
          if (obj.content.match(match)) {
            parser = ps[match]
            break
          }
        }
        break

    }

    if (!parser)
      throw new Error("No parser found for message: " + message)

    parser(obj)
  },

  //
  addParser(type, match, proc) {
    parsers[type] = parsers[type] || {}
    if (match.id) match = match.id
    parsers[type][match] = proc
  }

}