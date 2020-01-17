// Imports
import socketIO from "socket.io";

// Classes
const Server = require('./classes/Server');

// Config
var config = {
    "Port": 5000,
}

// Connection
const io = socketIO(config["Port"]);

// Server
var server = new Server(io);
server.createRoom("a");
server.createRoom("b");
server.createRoom("c");