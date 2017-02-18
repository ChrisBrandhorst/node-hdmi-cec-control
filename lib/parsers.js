'use strict'

const Message   = require('./message'),
      Proto     = require('./proto')

// Vendor ID response
Message.addParser(
  Message.types.Traffic,
  Proto.MessageType.DEVICE_VENDOR_ID,
  (o,c) => {
    c.updateDevice(o.source, {
      vendor: Proto.Vendor[ o.frame.join("") ]
    })
  }
)

// OSD Name response
Message.addParser(
  Message.types.Traffic,
  Proto.MessageType.SET_OSD_NAME,
  (o,c) => {
    c.updateDevice(o.source, {
      osdName: (new Buffer(o.frame.join(""), 'hex')).toString().trim().replace(/\u0000+$/, "")
    })
  }
)

// Power status response
Message.addParser(
  Message.types.Traffic,
  Proto.MessageType.REPORT_POWER_STATUS,
  (o,c) => {
    c.updateDevice(o.source, {
      powerStatus: Proto.PowerStatus[o.frame]
    })
  }
)

// Physical address response
Message.addParser(
  Message.types.Traffic,
  Proto.MessageType.REPORT_PHYSICAL_ADDRESS,
  (o,c) => {
    c.updateDevice(o.source, {
      type:             Proto.DeviceType[o.frame.pop()],
      physicalAddress:  o.frame.join(""),
      this:             !o.incoming
    })
  }
)

// Active source
Message.addParser(
  Message.types.Traffic,
  Proto.MessageType.ACTIVE_SOURCE,
  (o,c) => {
    c.setActiveDevice(o.frame.join(""))
  }
)

// Audio mode status
let audioModeStatusParser = (o,c) => {
  var audioModeStatus = o.frame.join("") == "01"
  console.info("Audio mode status: " + audioModeStatus)
}
Message.addParser(
  Message.types.Traffic,
  Proto.MessageType.SYSTEM_AUDIO_MODE_STATUS,
  audioModeStatusParser
)
Message.addParser(
  Message.types.Traffic,
  Proto.MessageType.SET_SYSTEM_AUDIO_MODE,
  audioModeStatusParser
)