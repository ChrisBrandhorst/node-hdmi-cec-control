'use strict'

const EventEmitter  = require('events'),
      sshExec       = require('ssh-exec'),
      Message       = require('./message'),
      Proto         = require('./proto'),
      debounce      = require('debounce'),
      _             = require('underscore')
require('./parsers')

module.exports = class HdmiCecController extends EventEmitter {

  //
  constructor(options) {
    super()
    options = options || {}
    // TODO: error handling for missing / invalid options

    this.clientPath = options.clientPath
    this.remote = options.remote

    this.status = {
      'devices':            {},
      'devices.active':     null,
      'devices.this':       null,
      'audio.mode.status':  false
    }

    this.emitStatusUpdate = debounce(this.emitStatusUpdate, 100)
  }


  //
  connect() {
    var self = this

    if (self.stream) self.emit('error', "Cannot connect: a connection is already present")

    if (self.remote) {
      self.stream = sshExec(self.clientPath, self.remote)
      self.connected = true
    }
    else {
      throw new Error("Connecting to local cec-client is not yet supported.")
    }

    // Init default devices
    _.each(Proto.defaultDevices, (device, id) => {
      self.updateDevice( device.device, device )
    })

    // Data can be multiple lines
    self.stream.on('data', (data) => {
      var lines = data.toString().replace( /[\n\r]*$/, "").split("\n")
      for (var i in lines) {
        var line = lines[i]
        read(self, line)
        self.emit('data', line)
      }
    })

    // Readable: Emitted when the stream and any of its underlying resources (a file descriptor,
    // for example) have been closed. The event indicates that no more events will be emitted,
    // and no further computation will occur. Not all streams will emit the 'close' event.
    self.stream.on('close', () => {
      console.log("Close")
      delete self.stream
      self.connected = false
      self.emit('close')
      self.removeAllListeners()
    })

    // Readable: This event fires when there will be no more data to read.
    // Note that the 'end' event will not fire unless the data is completely consumed.
    self.stream.on('end', () => {
      console.log("End")
      self.emit('end')
      self.removeAllListeners()
    })

    // Writeable: Emitted if there was an error when writing or piping data.
    // Readable: Emitted if there was an error receiving data.
    self.stream.on('error', (error) => {
      console.log("Error")
      self.emit('error', "Stream error: " + error)
    })

    // Writeable: When the stream.end() method has been called, and all data has been flushed to
    // the underlying system, this event is emitted.
    self.stream.on('finish', () => {
      console.log("Finish")
      self.emit('finish')
      self.removeAllListeners()
    })

    // When the current device is set
    this.on('device.update.this', (val, device) => {
      if (val) {
        this.giveSystemAudioModeStatus()
        this.removeAllListeners('device.update.this')
      }
    })

    // Scan for devices
    this.scan()
  }


  //
  disconnect() {
    this.ensureConnected()
  }


  //
  scan() {
    this.ensureConnected()
    this.stream.write("scan\n")
  }


  //
  giveSystemAudioModeStatus() {
    var device = this.getDevice('this', true)
    write(
      this,
      device.device,
      Proto.Device.AUDIO_SYSTEM,
      Proto.MessageType.GIVE_SYSTEM_AUDIO_MODE_STATUS
    )
  }


  /**
   * Used to ensure there is an active connection with the receiver before sending.
   */
  ensureConnected() {
    if (!this.stream || !this.connected) throw new Error('error', "Unable to execute method: no stream")
  }


  /**
   * Emit the current status. This method is debounced.
   */
  emitStatusUpdate() {
    this.emit('update', this.status)
  }

  
  /**
   * Gets the device by the given property value
   */
  getDevice(prop, val) {
    return _.find(this.status.devices, (d, id) => {
      return d[prop] == val ? d : false
    })
  }


  /**
   * 
   */
  updateDevice(device, data) {
    var statDevice  = this.status.devices[device.id],
        updated     = false

    if (!statDevice) {
      statDevice = this.status.devices[device.id] = {
        device: device
      }
      this.emit('device.new', statDevice)
      this.emit('device.new.' + device.id, statDevice)
    }

    _.each(data, (val, prop) => {
      if (statDevice[prop] != val) {
        statDevice[prop] = val
        this.emit('device.update.' + device.id, prop, val, statDevice)
        this.emit('device.update.' + prop, val, statDevice)
        this.emit('device.update.' + device.id + '.' + prop, val, statDevice)
        updated = true
      }
    })

    if (updated) {
      this.emit('device.update', statDevice, this)
      this.emit('devices.update', this.status.devices, this)
      this.emitStatusUpdate()
    }
  }


  /**
   *
   */
  setActiveDevice(physicalAddress) {
    var device = this.getDevice('physicalAddress', physicalAddress)
    if (this.status['devices.active'] != device) {
      this.status['devices.active'] = device
      this.emit('devices.update.active', device)
    }
  }

}



/**
 * Processes responses from the stream.
 */
function read(controller, message) {
  controller.emit('read', message)

  var messageObj
  messageObj = Message.parse(message, controller)

}


function write(controller, src, dst, type, msg) {
  var frame = [
    "" + src.id + dst.id,
    type.id
  ]
  if (msg) frame.push(msg)
  controller.stream.write("tx " + frame.join(":"))
}