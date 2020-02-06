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
        socket.on("canvas", function(data) { self.handleCanvas(data) });
        socket.on("paint", function(data) { self.handlePaint(data) });
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

    sendWarning(message) {
        this.user.getConnection().sendPacket("warning", { "type": "ERROR", "message": message });
    }

    // Recieve and handle join data
    handleJoin(data) {
        try {
            var json = JSON.parse(data);

            if (json.room) {
                var room = this.user.getServer().getRoom(json.room);

                if (room) {
                    this.user.setRoom(room);
                } else {
                    this.user.getConnection().sendPacket("join", { "state": "INVALID_ROOM" });
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    // Recieve and handle chat data
    handleChat(data) {
        try {
            var endTime = new Date();
            var timeDiff = endTime - this.time;
            this.time = endTime;

            if (timeDiff > 500 || json.type === "HISTORY") {
                var json = JSON.parse(data);

                if (json.type != undefined && json.type === "HISTORY") {
                    var length = json.size;
                    this.user.getRoom().sendChatHistory(this.user, length + 10);
                } else {
                    if (json.message.length < 5) {
                        this.sendWarning("Message is to short");
                    } else {
                        this.user.getRoom().sendUserMessage(this.user, json.message);
                    }
                }
            } else {
                this.sendWarning("Please wait befor sending a new message...");
            }
        } catch (error) {
            console.log(error);
        }
    }
    // Recieve and handle board data
    handleBoard(data) {
        try {
            var room = this.user.getRoom();

            if (room != undefined) {
                var json = JSON.parse(data);

                switch(json.type) {
                    case "ADD":
                        room.getBoard().addMessage(this.user.getUuid(), json.position);
                        break;
                    case "REMOVE":
                        room.getBoard().removeMessage(this.user.getUuid(), json.position);
                        break;
                    case "UP_VOTE":
                        room.getBoard().upVote(this.user.getUuid(), json.position);
                        break;
                    case "DOWN_VOTE":
                        room.getBoard().downVote(this.user.getUuid(), json.position);
                        break;
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    handleCanvas(data) {
        try {
            var json = JSON.parse(data);

            if (json.type) {
                var canvas = this.user.getServer().getCanvas(this.user.getCanvasUuid());
                
                switch(json.type) {
                    case "JOIN":
                        if (json.uuid) {
                            var canvasNew = this.user.getServer().getCanvas(json.uuid);

                            if (canvasNew) {
                                canvas.leave(this.user);
                                canvasNew.join(this.user);
                            }

                        }
                        break;
                    case "LEAVE":
                        canvas.leave(this.user);
                        break;
                    case "RESET":
                        canvas.reset();
                        break;
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    handlePaint(data) {
        try {
            var canvas = this.user.getServer().getCanvas(this.user.getCanvasUuid());

            if (canvas) {
                canvas.send(data);
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Main function for sending data
    sendRawPacket(channel, rawData) {
        try {
            this.socket.emit(channel, rawData);
            console.log("Sending raw packet... " + channel);
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