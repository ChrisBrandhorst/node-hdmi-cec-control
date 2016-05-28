'use strict'

const Message   = require('./message'),
      Proto     = require('./proto')

// Vendor ID response
Message.addParser(
  Message.types.Traffic,
  Proto.MessageType.DEVICE_VENDOR_ID,
  (obj) => {
    obj.vendor = Proto.Vendor[ obj.frame.join("") ]
    console.log( obj.source.name + " is from " + obj.vendor.name )
  }
)

// OSD Name response
Message.addParser(
  Message.types.Traffic,
  Proto.MessageType.SET_OSD_NAME,
  (obj) => {
    obj.osdName = (new Buffer(obj.frame.join(""), 'hex')).toString()
    console.log( obj.source.name + " is called " + obj.osdName )
  }
)

// Power status response
Message.addParser(
  Message.types.Traffic,
  Proto.MessageType.REPORT_POWER_STATUS,
  (obj) => {
    obj.powerStatus = Proto.PowerStatus[obj.frame]
    console.log( obj.source.name + " is " + obj.powerStatus.name )
  }
)

// Physical address response
Message.addParser(
  Message.types.Traffic,
  Proto.MessageType.REPORT_PHYSICAL_ADDRESS,
  (obj) => {
    obj.deviceType = Proto.DeviceType[obj.frame.pop()]
    obj.physicalAddress = obj.frame.join("")
    console.log( obj.source.name + " is a " + obj.deviceType.name )
    console.log( obj.source.name + " has physical address " + obj.physicalAddress )
  }
)