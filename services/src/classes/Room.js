const Board = require('./Board');

const internal = {};

module.exports = internal.Room = class {
    constructor(name, server) {
        this.server = server;
        this.name = name;
        this.userUuids = [];
        this.messages = [];
        this.board = new Board(this);
        this.lastUpdate = new Date();
        this.canvas = [];

        console.log("Room [" + name + "] created!")
    }

    getServer() {
        return this.server;
    }
    getUuid() {
        return this.uuid;
    }
    getName() {
        return this.name;
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

    addCanvas(canvas) {
        this.canvas.push(canvas);
    }
    getCanvas() {
        return this.canvas;
    }

    // Used to track auto save
    setLastUpdate(lastUpdate) {
        this.lastUpdate = lastUpdate; // Server will auto save the room
    }
    getLastUpdate() {
        return this.lastUpdate;
    }

    // Message
    getMessage(position) {
        if (position < this.messages.length) {
            return this.messages[position];
        }
    }
    setMessages(messages) {
        this.messages = messages;
    }

    // Sending a system message ('User x joined', ...)
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
    // Send a user message
    sendUserMessage(user, message) {
        var messages = [];
        messages.push(message);

        var packet = {
            "type": "USER",
            "position": this.messages.length,
            "uuid": user.getUuid(),
            "name": user.getName(),
            "messages": messages,
            "color": this.userUuids.indexOf(user.getUuid()),
            "time": new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})
        };

        this.messages.push(packet); // Put message into room history

        this.notify("chat", packet);
    }
    // Send a part of the last chatted messages. This will reset the complete chat screen
    sendChatHistory(user, size = 0) {
        var packet = {
            "type": "HISTORY",
            "messages": [],
            "full": false,
            "fetch": (size != 0) 
        };

        if (size <= 0) {
            size = this.server.getConfig()["ROOM_HISTORY_LENGTH"]; // Load size from the config
        }

        // Adding the latest message within a given size
        for (var i = this.messages.length - 1; i >= 0 && packet.messages.length < size; i--) {
            packet.messages.push(this.messages[i]);
        }

        // This value will scroll the clients chat window to the botton. Only used when the chat is send for the first time. Additional histories are requests by scrolling up
        packet.full = packet.messages.length >= this.messages.length;

        packet.messages.reverse();
        
        user.getConnection().sendPacket("chat", packet);
        console.log("Sending user history with " + size + " messages");
    }

    sendDetail(user = undefined) {
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
            "name": this.name, 
            "title": "Details",
            "content": [
                {
                    "title": "Information",
                    "text": "UUID: " + this.uuid,
                }
            ],
            "clients": clients
        }

        if (user == undefined) {
            this.notify("detail", packet);
        } else {
            user.getConnection().sendPacket("detail", packet);
        }
    }

    // Notice that we only store the uuid. We can find a user by its uuid from the server class
    addUser(user) {
        if (this.userUuids.indexOf(user.getUuid()) == -1) {
            this.userUuids.push(user.getUuid());
            this.update();
        }
    }
    leaveUser(user) {
        var index = this.userUuids.indexOf(user.getUuid());

        if (index != -1) {
            this.userUuids.splice(index, 1);
            this.update();
        }
    }
    removeUser(user) {
        // Nothing... 
    }

    // This will send a packet to all users inside this room
    notify(channel, data) {
        if (this.lastUpdate == -1) {
            this.lastUpdate = new Date();
        }

        var self = this;

        this.userUuids.forEach(function(uuid) {
            var user = self.server.findUser(uuid);
            
            // Send only packet to player that is in this room
            if (user && user.insideRoom(self)) {
                user.getConnection().sendPacket(channel, data);
            }
        });
    }
    
    // This will send every client the room details
    update() {
        this.sendDetail();
    }

    createSnapshot() {
        var snapshot = { 
            _id: this.uuid,
            name: this.name,
            userUuids: this.userUuids,
            messages: this.messages,
            board: this.board.createSnapshot()
        };

        return snapshot;
    }
    loadSnapshot(snapshot) {
        this.uuid = snapshot._id;
        this.name = snapshot.name;
        this.userUuids = snapshot.userUuids;
        this.messages = snapshot.messages;
        this.board.loadSnapshot(snapshot.board);
    }
}