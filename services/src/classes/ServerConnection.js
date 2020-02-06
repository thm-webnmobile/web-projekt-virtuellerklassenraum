const internal = {};

module.exports = internal.Server = class {
    constructor(server, connection) {
        this.server = server;
        this.connection = connection;

        var self = this;

        this.connection.on("connection", function(socket) { 
            self.handleHandshake(socket, server);
        });
    }

    handleHandshake(socket, server) {
        var self = this;
        var address = socket.handshake.address;

        var handshake = function() {
            console.log("Handshake [" + address + "]: " + "Client can now login");

            socket.removeAllListeners();
            socket.on("handshake", handshake);
            socket.on("login", function(data) {
                // Client tries to reconnect
                if (data == undefined) {
                    console.log("Handshake [" + address + "]: " + "Client is reconnecting...");

                    var user = server.getUser(socket);
                    var room = user == undefined ? undefined : user.getRoom();

                    if (room !== undefined) {
                        user.setConnection(socket); // Once a client is connection, we will register every other event
                        user.getConnection().sendPacket("login", {"state": "SUCCESS", "uuid": user.getUuid() });
                        user.setRoom(room);
                    }
                } else {
                    console.log("Handshake [" + address + "]: " + "Client is connecting...");

                    // Client tries to login
                    var request = JSON.parse(data);

                    try {
                        // Now we validate the request and generate a response
                        if (request.name == undefined || request.name.length < 2 || request.name.length > 16) {
                            socket.emit("login", JSON.stringify({"state": "INVALID_NAME" })); // Invalid name
                        } else if (request.room == undefined || request.room.length > 16) {
                            socket.emit("login", JSON.stringify({"state": "INVALID_ROOM" })); // Invalid room
                        } else {
                            var name = request.name; // Name
                            var room = server.getRoom(request.room); // Room

                            if (room) {
                                // Retrieve data from database and send response to client when callback is executed
                                self.retrieveUserFromDatabase(socket, name, function(user) {
                                    user.setConnection(socket);
                                    user.getConnection().sendPacket("login", {"state": "SUCCESS", "uuid": user.getUuid(), "name": user.getName() });

                                    // We need to set room after login packet
                                    user.setRoom(room, true); // This function will also send the room packets to the client
                                    
                                    var canvas = server.createCanvas(user.getUuid());
                                    canvas.join(user);
                                });
                            } else {
                                server.createRoom(request.room);
                            }

                            room = server.getRoom(request.room);

                            if (!room) {
                                console.log("Room '" + request.room + "' not found...");
                                socket.emit("login", JSON.stringify({"state": "INVALID_ROOM_UUID" })); // Room does not exists
                            }
                        }
                    } catch(error) {
                        console.log(error);

                        socket.emit("login", JSON.stringify({"state": "ERROR" }));
                    }
                }
            });

            // We notify the client, that we now listen to all the packets and show if the already know him
            socket.emit("handshake", JSON.stringify({"state": server.getUser(socket) ? 1 : 0 }));
        }

        // If we recieve the handshake, then we listen to all the packets
        socket.on("handshake", handshake);
    }
    
    retrieveUserFromDatabase(socket, name, callback) {
        // Create default user class
        var user = this.server.registerUser(socket);
        user.setName(name);

        var collection = this.server.getDatabase().get().collection('user');
        var query = { name : name };

        console.log("Searching user in database...");
        collection.findOne(query, function(error, result) {
            if (error) throw error;

            if (result) {
                console.log("User found!");
                user.loadSnapshot(result);
                callback(user);
            } else {
                console.log("User not found! Insert new user...");
                collection.insertOne(user.createSnapshot(), function(error, result) {
                    if (error) throw error;

                    if (result && result.ops && result.ops.length > 0) {
                        console.log("User inserted!");
                        user.loadSnapshot(result.ops[0]);
                        callback(user);
                    }
                });
            }
        });
    }
}