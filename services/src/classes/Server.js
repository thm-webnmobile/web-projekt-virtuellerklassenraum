const ServerConnection = require('./ServerConnection');
const Room = require('./Room');
const User = require('./User');

const internal = {};

module.exports = internal.Server = class {
    constructor(io) {
        this.connection = new ServerConnection(this, io);
        this.rooms = [];
        this.users = [];
        this.uuids = 0;

        this.config = {
            "RECONNECT_TIME": 5000 // Time in milliseconds for the client to reconnect
        }

        // Start a runnable to handle server actions
        var self = this;

        setInterval(function() {
            try {
                self.run();
            } catch (error) {
                console.log(error);
            }
        }, 1000);
    }

    // Connection
    getConnection() {
        return this.connection;
    }

    // Rooms
    createRoom(uuid) {
        this.rooms.push(new Room(uuid, this));
    }
    getRoom(uuid) {
        for (var i = (this.rooms.length - 1); i >= 0; i--) {
            var room = this.rooms[i];

            if (room.getUuid() == uuid) {
                return room;
            }
        }
    }
    getRooms() {
        return this.rooms;
    }

    // This will get the user by its uuid. User can be offline.
    findUser(uuid) {
        // Loop backwards to prevent modification crashs
        for (var i = (this.users.length - 1); i >= 0; i--) {
            var user = this.users[i];

            if (user.getUuid() == uuid) {
                return user;
            }
        }
    }
    // Get the user by its uuid. This user has to be online otehrwise this will return undefined
    getUser(socket) {
        // Loop backwards to prevent modification crashs
        for (var i = (this.users.length - 1); i >= 0; i--) {
            var user = this.users[i];

            if (user.getConnection().getAddress() == socket.handshake.address) {
                return user;
            }
        }
    }
    registerUser(socket) {
        var user = this.getUser(socket);

        // User is already connected with the server... just create new connection
        if (user === undefined) {
            user = new User(this.uuids++, this);
            this.users.push(user);
        }

        return user;
    }

    run() {
        // Timeout client after disconnect
        for (var i = (this.users.length - 1); i >= 0; i--) {
            var user = this.users[i];

            // Client has disconnected!
            if (user.getConnection().getDisconnectTime()) {
                var disconnectDiff = new Date() - user.getConnection().getDisconnectTime();

                if (disconnectDiff > this.config["RECONNECT_TIME"]) {
                    user.disconnect();
                    this.users.splice(i, 1);
                    console.log("User [" + user.getUuid() + "]: Client timed out");
                }
            }
        }
    }
}