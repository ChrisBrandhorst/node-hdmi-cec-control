"use strict"

const CecProto = require('./cec-proto')

class CecCommand {

  constructor(seq, dir, message) {
    this.seq = seq;
    this.outgoing = dir == "<<"
    this.incoming = dir == ">>"
  }

}

//
CecCommand.parse = function(response) {
  var parts = response.match(/^([A-Z]+):\s*\[\s*(\d+)\]\s(<<|>>)?\s?(.*)$/)

  if (!parts)
    throw new Error("Unknown response format", response)

  var type          = parts[1],
      seq           = parts[2],
      dir           = parts[3],
      message       = parts[4]

  // We don't handle outgoing messages
  // if (dir == "<<") return

  switch (type) {

    // We don't do anything with these
    case "WARNING":
    case "NOTICE":
      return null

    // 
    case "TRAFFIC":
      return CecCommand.parseTraffic(message)

    case "DEBUG":
      break;
  }
  

}


CecCommand.parseTraffic = function(message) {
  var msgObj        = {},
      messageTypes  = CecProto.MessageTypes

  var frame   = message.toUpperCase().split(":"),
      header  = frame.shift(),
      opcode  = frame.shift()

  msgObj.source = CecProto.Devices[ header[0] ]
  msgObj.destination = CecProto.Devices[ header[1] ]
  msgObj.messageType = messageTypes[ opcode ] || messageTypes.PollingMessage
  
  switch (msgObj.messageType) {

    case messageTypes.DEVICE_VENDOR_ID:
      msgObj.vendor = CecProto.Vendors[ frame.join("") ]
      console.log( msgObj.source.name + " is from " + msgObj.vendor.name )
      break

    case messageTypes.SET_OSD_NAME:
      msgObj.osdName = (new Buffer(frame.join(""), 'hex')).toString()
      console.log( msgObj.source.name + " is called " + msgObj.osdName )
      break

  }

  msgObj.parameters = frame

  // console.log(msgObj.messageType.name + ": " + msgObj.source.name + " --> " + msgObj.destination.name + (frame.length > 0 ? ", with: " + frame.join(":") : "") )

}

module.exports = CecCommand