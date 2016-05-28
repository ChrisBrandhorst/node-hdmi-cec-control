'use strict'

const HdmiCecController = require('../lib/hdmi-cec-control')

var controller = new HdmiCecController({
  clientPath:   '/usr/osmc/bin/cec-client --type r --osd-name Smartie',
  remote:       {
    user:       'osmc',
    host:       'osmc',
    password:   'osmc'
  }
})

controller.connect()

controller.on('error', (err, resp) => {
  // console.error(err + ": " + resp)
})