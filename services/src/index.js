// Imports
import socketIO from "socket.io";

var db = require('./Database')

// Classes
const Server = require('./classes/Server');

// Config
var config = {
    "Port": 5000,
}

// Connect to Database
console.log("Connecting to database...");

db.connect('mongodb://localhost:27017', function(err) {
    if (err) {
        console.log('Connection failed. Unable to connect to database');
        process.exit(1);
    } else {
        console.log("Connected successfully to database");
        start();
    };
});

var start = function() {
    // Connection
    console.log("Initialize connection...");
    const io = socketIO(config["Port"]);

    // Server
    console.log("Initialize server...");
    var server = new Server(io, db);
}