const ServerConnection = require('./ServerConnection');
const Room = require('./Room');
const User = require('./User');

const internal = {};

module.exports = internal.Server = class {
    constructor(io, db) {
        this.database = db;
        this.connection = new ServerConnection(this, io);
        this.rooms = [];
        this.users = [];

        this.loadRoomsFromDatabase();

        this.config = {
            "ROOM_AUTO_SAVE": 5000, // Time in milliseconds when the room will be saved into the database
            "ROOM_HISTORY_LENGTH": 20,
            "RECONNECT": false,
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
    getDatabase() {
        return this.database;
    }
    getConnection() {
        return this.connection;
    }
    getConfig() {
        return this.config;
    }

    // Rooms
    createRoom(uuid) {
        var self = this;

        var sampleRoom = new Room(uuid, self);
        var sampleRoomSnapshot = sampleRoom.createSnapshot();

        var collection = this.database.get().collection('room');

        collection.insertOne(sampleRoomSnapshot, function(error, result) {
            if (error) throw error;
            
            if (result && result.ops && result.ops.length > 0) {
                sampleRoom.loadSnapshot(result.ops[0]); // Generate snapshot with the newly created database data

                self.rooms.push(sampleRoom); // Register room by pushing it into the servers rooms list
                console.log("Room [name: " + sampleRoom.getName() + ", uuid: " + sampleRoom.getUuid() + "] created");
            }
        });
    }
    getRoomByUuid(uuid) {
        for (var i = (this.rooms.length - 1); i >= 0; i--) {
            var room = this.rooms[i];

            if (room.getUuid().toString() === uuid.toString()) {
                return room;
            }
        }
    }
    getRoom(name) {
        for (var i = (this.rooms.length - 1); i >= 0; i--) {
            var room = this.rooms[i];

            if (room.getName() == name) {
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
        var reconnect = this.config["RECONNECT"];

        // Loop backwards to prevent modification crashs
        for (var i = (this.users.length - 1); i >= 0; i--) {
            var user = this.users[i];

            if (reconnect ? user.getConnection().getAddress() == socket.handshake.address : user.getConnection().getSocket().id == socket.id) {
                return user;
            }
        }
    }
    registerUser(socket) {
        var user = this.getUser(socket);

        // User is already connected with the server... just create new connection
        if (user === undefined) {
            user = new User(this);
            this.users.push(user);
        }

        return user;
    }

    saveRooms() {
        var self = this;
        var collection = null;

        for (var i = (this.rooms.length - 1); i >= 0; i--) {
            var room = this.rooms[i];

            if (room.getLastUpdate() != -1) {
                var updateDiff = new Date() - room.getLastUpdate();

                // Check if we need to update the room. Last update need to passes a given time
                if (updateDiff > this.config["ROOM_AUTO_SAVE"]) {
                    if (collection == null) {
                        collection = this.database.get().collection('room');
                    }

                    console.log("Saving Room [" + room.getUuid() + "]...");

                    var snapshot = room.createSnapshot();
                    collection.update({ _id: room.getUuid() }, snapshot);
                    room.setLastUpdate(-1); // Reseting the last update. The room is up to date
                }
            }
        }
    }

    loadRoomsFromDatabase() {
        var self = this;
        var collection = this.database.get().collection('room');

        collection.find().toArray(function(err, results) {
            for (var i = (results.length - 1); i >= 0; i--) {
                var result = results[i];

                var room = new Room(result.name, self);
                room.loadSnapshot(result); // Generate snapshot with the old database data
   
                self.rooms.push(room); // Register room by pushing it into the servers rooms list
            }

            console.log("Rooms loaded [" + results.length + "]");

            // No rooms inside the database. We need to create example ones
            if (results.length < 1) {
                console.log("Rooms are empty... creating samples...");

                // Generate room a, b and c
                var sampleRoomNames = ["a", "b", "c"];

                for (var j = 0; j < sampleRoomNames.length; j++) {
                    var sampleRoom = new Room(sampleRoomNames[j], self);
                    var sampleRoomSnapshot = sampleRoom.createSnapshot();

                    collection.insertOne(sampleRoomSnapshot, function(error, result) {
                        if (error) throw error;
                        
                        if (result && result.ops && result.ops.length > 0) {
                            sampleRoom.loadSnapshot(result.ops[0]); // Generate snapshot with the newly created database data

                            self.rooms.push(sampleRoom); // Register room by pushing it into the servers rooms list
                            console.log("Room [name: " + sampleRoom.getName() + ", uuid: " + sampleRoom.getUuid() + "] created");
                        }
                    });
                }
            }
        });
    }

    run() {
        this.saveRooms();
        
        // Timeout client after disconnect
        for (var i = (this.users.length - 1); i >= 0; i--) {
            var user = this.users[i];

            // Client has disconnected!
            if (user.getConnection().getDisconnectTime()) {
                var disconnectDiff = new Date() - user.getConnection().getDisconnectTime();

                // Check if the user passed a given time
                if (disconnectDiff > this.config["RECONNECT_TIME"]) {
                    user.disconnect(); // Call disconnect function
                    this.users.splice(i, 1); // Remove user from user list
                    console.log("User [" + user.getUuid() + "]: Client timed out");
                }
            }
        }
    }
}