"use strict"

const EventEmitter  = require('events'),
      sshExec       = require('ssh-exec'),
      CecCommand    = require('./cec-command')

module.exports = class HdmiCecController extends EventEmitter {

  //
  constructor(options) {
    super()
    options = options || {}
    // TODO: error handling for missing / invalid options

    this.clientPath = options.clientPath
    this.remote = options.remote

    this.status = {
      'devices':        [],
      'devices.active': null,
    }
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
      // TODO: auto reconnect
      self.emit('close')
    })

    // Readable: This event fires when there will be no more data to read.
    // Note that the 'end' event will not fire unless the data is completely consumed.
    self.stream.on('end', () => {
      console.log("End")
      self.emit('end')
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
    })

    this.scan()
  }


  //
  disconnect() {
    this.ensureConnected()
    socket.destroy()
  }


  //
  scan() {
    this.ensureConnected()
    this.stream.write("scan\n")
  }


  /**
   * Used to ensure there is an active connection with the receiver before sending.
   */
  ensureConnected() {
    if (!this.stream || !this.connected) throw new Error('error', "Unable to execute method: no stream")
  }

}



/**
 * Processes responses from the stream.
 */
function read(controller, response) {
  // console.log("--> " + response)

  var command
  try {
    command = CecCommand.parse(response)
  }
  catch (e) {
    controller.emit('error', "Invalid response received", e)
  }


}