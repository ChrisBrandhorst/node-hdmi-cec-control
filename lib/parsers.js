'use strict'

const Message   = require('./message'),
      Proto     = require('./proto')

// Vendor ID response
Message.addParser(
  Message.types.Traffic,
  Proto.MessageTypes.DEVICE_VENDOR_ID,
  (obj) => {
    obj.vendor = Proto.Vendors[ obj.frame.join("") ]
    console.log( obj.source.name + " is from " + obj.vendor.name )
  }
)

// OSD Name response
Message.addParser(
  Message.types.Traffic,
  Proto.MessageTypes.SET_OSD_NAME,
  (obj) => {
    obj.osdName = (new Buffer(obj.frame.join(""), 'hex')).toString()
    console.log( obj.source.name + " is called " + obj.osdName )
  }
)