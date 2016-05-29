'use strict'

const HdmiCecController = require('../lib/hdmi-cec-control')

var controller = global.controller = new HdmiCecController({
  clientPath:   '/usr/osmc/bin/cec-client --type r --osd-name Kodi',
  remote:       {
    user:       'osmc',
    host:       'osmc',
    password:   'osmc'
  }
})

controller.on('message.error.format', (message) => {
  console.warn("UNKNOW: " + message)
})
controller.on('message.error.parser', (msg) => {
  console.warn("NOPARS: " + msg.raw)
})
controller.on('message.parsed', (raw) => {
  console.log("PARSED: " + raw.raw)
})


controller.on('device.new', (device) => {
  console.info("New device: " + device.device.name)
})
controller.on('device.update.osdName', (val, device) => {
  console.info(device.device.name + " has name: " + val)
})
controller.on('devices.update.active', (device) => {
  console.info("Active device: " + device.device.name)
})


controller.connect()



// Audio to:
//    AMP:  55:70:26:00
//    TV:   55:70
// Switch to:
//    Kodi:       1f:82:26:00
//    Chromecast: 1f:82:25:00
//    TV:         10:9d:26:00   // Afhankelijk van huidige source
//                0f:82:00:00   // Als het vanaf de tv komt