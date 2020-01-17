const Board = require('./Board');

const internal = {};

module.exports = internal.Room = class {
    constructor(uuid, server) {
        this.server = server;
        this.uuid = uuid;
        this.userUuids = [];
        this.messages = [];
        this.board = new Board(this);

        console.log("Room [" + uuid + "] created!")
    }

    getServer() {
        return this.server;
    }
    getUuid() {
        return this.uuid;
    }
    getUserUuids() {
        return this.userUuids;
    }
    getMessages() {
        return this.messages;
    }
    getBoard() {
        return this.board;
    }


    getMessage(position) {
        if (position < this.messages.length) {
            return this.messages[position];
        }
    }

    // Sending a system message ('player x joined', ...)
    sendSystemMessage(message) {
        var messages = [];
        messages.push(message);

        var packet = {
            "type": "SYSTEM",
            "position": this.messages.length,
            "messages": messages,
            "time": new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})
        };

        this.messages.push(packet); // Put message into room history

        this.notify("chat", packet);
    }
    // Send a user message with avatar 
    sendUserMessage(user, message) {
        var messages = [];
        messages.push(message);

        var packet = {
            "type": "USER",
            "position": this.messages.length,
            "uuid": user.getUuid(),
            "name": user.getName(),
            "messages": messages,
            "time": new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})
        };

        this.messages.push(packet); // Put message into room history

        this.notify("chat", packet);
    }
    // Send a part of the last chatted messages. This will reset the complete chat screen
    sendChatHistory(user) {
        var packet = {
            "type": "HISTORY",
            "messages": []
        };

        for (var i = this.messages.length - 1; i >= 0 && packet.messages.length < 256; i--) {
            packet.messages.push(this.messages[i]);
        }

        packet.messages.reverse();
        
        user.getConnection().sendPacket("chat", packet);
    }

    // Notice that we only store the uuid. We can find a user by its uuid from the server
    addUser(user) {
        if (this.userUuids.indexOf(user.getUuid()) == -1) {
            this.userUuids.push(user.getUuid());
            this.update();
        }
    }
    removeUser(user) {
        var index = this.userUuids.indexOf(user.getUuid());

        if (index != -1) {
            this.userUuids.splice(index, 1);
            this.update();
        }
    }

    // This will send a packet to all users inside this room
    notify(channel, data) {
        var self = this;

        this.userUuids.forEach(function(uuid) {
            var user = self.server.findUser(uuid);
            
            // Send only packet to player that is in this room
            if (user) {
                user.getConnection().sendPacket(channel, data);
            }
        })
    }
    
    // This will send every client the room details
    update() {
        var clients = [];

        var self = this;

        // We need to loop through all the user uuids inside this room and then retrieve the user from the server
        this.userUuids.forEach(function(uuid) {
            var user = self.server.findUser(uuid);

            if (user) {
                clients.push({ "name": user.getName() });
            }
        });

        var packet = {
            "title": "Details",
            "content": [
                {
                    "title": "Information",
                    "text": "UUID: " + this.uuid,
                }
            ],
            "clients": clients
        }

        this.notify("detail", packet);
    }
}