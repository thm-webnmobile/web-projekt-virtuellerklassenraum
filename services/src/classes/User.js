const UserConnection = require('./UserConnection');

const internal = {};

module.exports = internal.User = class {
    constructor(uuid, server) {
        this.uuid = uuid;
        this.server = server;
        this.rooms = [];
 
        console.log("Create user");
    }

    getUuid() {
        return this.uuid;
    }
    getServer() {
        return this.server;
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
        console.log("User name set to: " + this.name);
    }

    // Room
    getRooms() {
        return this.rooms;
    }
    getRoom() {
        return this.room;
    }
    setRoom(room, notify = false) {
        // Remove user from previous room
        if (this.room !== undefined) {
            this.room.removeUser(this);

            if (notify) {
                this.room.sendSystemMessage(this.name + " left the chat.");
            }
        }
        
        // Set current room
        this.room = room;
        
        if (this.room != undefined && this.room != null) {
            // Add room to history
            if (this.rooms.indexOf(this.room.getUuid()) == -1) {
                this.rooms.push(this.room.getUuid());
            }
            // Server notify only when a client first joins. This is not called on reconnect
            if (notify) {
                this.room.sendSystemMessage(this.name + " joined the chat.");
            }
            
            this.room.addUser(this);
            this.room.sendChatHistory(this);
            this.room.getBoard().sendBoard(this);
            this.connection.sendPacket("rooms", this.rooms);
        }
    }
}