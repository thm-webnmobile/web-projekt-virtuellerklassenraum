const UserConnection = require('./UserConnection');

const internal = {};

module.exports = internal.User = class {
    constructor(server) {
        this.server = server;
        this.rooms = [];
 
        console.log("Create user");
    }

    getServer() {
        return this.server;
    }

    // Uuid
    getUuid() {
        return this.uuid;
    }
    setUuid(uuid) {
        this.uuid = uuid;
    }

    // Connection
    setConnection(socket) {
        this.connection = new UserConnection(socket, this);
    }
    getConnection() {
        return this.connection;
    }
    disconnect() {
        this.setRoom(undefined, true);
    }


    // Name
    getName() {
        return this.name;
    }
    setName(name) {
        this.name = name;
    }

    // Room
    setRooms(rooms) {
        this.rooms = rooms;
    }
    getRooms() {
        return this.rooms;
    }
    getRoom() {
        return this.room;
    }
    insideRoom(room) {
        return this.room && this.room.getUuid() == room.getUuid();
    }
    setRoom(room, notify = false) {
        // Remove user from previous room
        if (this.room !== undefined) {
            this.room.removeUser(this);
        }
        
        // Set current room
        this.room = room;
        
        if (this.room != undefined && this.room != null) {
            // Add room to history
            console.log();

            var alreadyInside = false;

            for (var i = 0; i < this.rooms.length; i++) {
                if (this.rooms[i].toString() === this.room.getUuid().toString()) {
                    alreadyInside = true;
                    break;
                }
            }

            if (!alreadyInside) {
                this.rooms.push(this.room.getUuid());
                this.saveSnapshot();
            }

            this.room.addUser(this);
            this.room.sendChatHistory(this); // We need to reset the clients chat screen and show nothing or the latest messages
            this.room.sendDetail(this);
            this.room.getBoard().sendBoard(this); // We need to reset the clients board and show nothing or all messages

            var roomNames = [];

            for (var i = 0; i < this.rooms.length; i++) {
                var tmpRoom = this.server.getRoomByUuid(this.rooms[i]);

                if (tmpRoom) {
                    roomNames.push(tmpRoom.getName());
                }
            }

            this.connection.sendPacket("rooms", roomNames);
        }
    }

    saveSnapshot() {
        var collection = this.server.getDatabase().get().collection('user');
        var query = { name : this.name };

        collection.update(query, this.createSnapshot());
    }
    createSnapshot() {
        var snapshot = { 
            _id: this.uuid,
            name: this.name,
            lastLogin: new Date(),
            lastAddress: (this.connection ? this.connection.getSocket().handshake.address : ""),
            registerDate: new Date(),
            rooms: this.rooms
        };

        // If the user has no uuid, we need to delete it. The batabase will generate this for us.
        if (!this.uuid) {
            delete snapshot._id;
        }

        return snapshot;
    }
    // Generate user snapshot
    loadSnapshot(snapshot) {
        this.uuid = snapshot._id;
        this.name = snapshot.name;
        this.lastLogin = snapshot.lastLogin;
        this.lastAddress = snapshot.lastAddress;
        this.registerDate = snapshot.registerDate;
        this.rooms = snapshot.rooms;
    }
}