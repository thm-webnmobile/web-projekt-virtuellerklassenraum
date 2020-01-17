const internal = {};

module.exports = internal.UserConnection = class {
    constructor(socket, user) {
        this.socket = socket;
        this.user = user;
        this.time = new Date();

        var self = this;

        socket.on("disconnect", function(data) { self.handleDisconnect() });
        socket.on("join", function(data) { self.handleJoin(data) });
        socket.on("chat", function(data) { self.handleChat(data) });
        socket.on("board", function(data) { self.handleBoard(data) });
    }

    getUser() {
        return this.user;
    }
    getSocket() {
        return this.socket;
    }
    getAddress() {
        return this.socket.handshake.address;
    }
    getDisconnectTime() {
        return this.disconnectTime;
    }

    // We need to register the time of the disconnect. After a certain amount of time, we will kick the client
    handleDisconnect() {
        this.disconnectTime = new Date();

        console.log("User [" + this.user.getUuid() + "]: " + "Disconnect!");
    }
    handleJoin(data) {
        try {
            var json = JSON.parse(data);

            if (json.room) {
                var room = this.user.getServer().getRoom(json.room);

                if (room) {
                    this.user.setRoom(room);
                } else {
                    this.user.sendPacket("join", JSON.stringify({ "state": "INVALID_ROOM" }));
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    handleChat(data) {
        try {
            var endTime = new Date();
            var timeDiff = endTime - this.time;
            this.time = endTime;

            if (timeDiff > 500) {
                var json = JSON.parse(data);
                this.user.getRoom().sendUserMessage(this.user, json.message);
            }
        } catch (error) {
            console.log(error);
        }
    }
    handleBoard(data) {
        try {
            var room = this.user.getRoom();

            if (room != undefined) {
                var json = JSON.parse(data);

                console.log(json.type);

                switch(json.type) {
                    case "ADD":
                        room.getBoard().addMessage(json.position);
                        break;
                    case "REMOVE":
                        room.getBoard().removeMessage(json.position);
                        break;
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    sendPacket(channel, data) {
        try {
            var json = JSON.stringify(data);

            if (json) {
                this.socket.emit(channel, json);
                console.log("Sending packet... " + channel);
            }
        } catch (error) {
            console.log(error);
        }
    }
}