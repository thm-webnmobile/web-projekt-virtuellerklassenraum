const internal = {};

module.exports = internal.Board = class {
    constructor(room) {
        this.room = room;
        this.messages = [];
    }
    
    addMessage(userUuid, position) {
        var alreadyIn = false;

        // Loop through all message to check if the message is already in
        for (var i = (this.messages.length - 1); i >= 0; i--) {
            var boardMessage = this.messages[i];

            // Message is already in
            if (boardMessage.position == position) {
                alreadyIn = true;
                break;
            }
        }

        this.update(userUuid, position);

        // Message is not inside the array. We need to add the message
        if (!alreadyIn) {
            this.messages.push({
                position: position,
                votes: []
            });

            this.update();
        }
    }
    removeMessage(userUuid, position) {
        var deleted = false;

        // Loop through all message
        for (var i = (this.messages.length - 1); i >= 0; i--) {
            // Find the message
            if (this.messages[i].position == position) {
                this.messages.splice(i, 1); // Remove the message from the array
                deleted = true;
            }
        }

        // Update board when a message is deleted
        if (deleted) {
            this.update();
        }
    }

    // Handle votes (down = -1, up = 1)
    downVote(userUuid, position) {
        this.setVote(userUuid, position, -1); 
    }
    upVote(userUuid, position) {
        this.setVote(userUuid, position, 1);
    }
    // Settings the vote from user by its uuids
    setVote(userUuid, position, type) {
        // Loop through the message to find the position
        for (var i = (this.messages.length - 1); i >= 0; i--) {
            var boardMessage = this.messages[i];

            if (boardMessage.position == position) {
                var alreadyVoted = false;

                // Loop throight votes to check if the user has already voted on the message
                for (var j = (boardMessage.votes.length - 1); j >= 0; j--) {
                    var vote = boardMessage.votes[j];

                    // User has already voted. We need to update the users vote
                    if (vote.userUuid.toString() == userUuid.toString()) {
                        alreadyVoted = true;

                        if (vote.type !== type) {
                            vote.type = type; // Update user vote due to changing of the vote type
                        } else {
                            boardMessage.votes.splice(j, 1); // Remove user vote due to clicking same vote type
                        }

                        this.update();
                    }
                }

                // User has not votes before
                if (!alreadyVoted) {
                    boardMessage.votes.push({
                        userUuid: userUuid,
                        type: type
                    });

                    this.update();
                }
            }
        }
    }

    update() {
        this.sendBoard(); // Send board to all connected clients
    }

    // Sending the board to one user or all users in the room
    sendBoard(user = undefined) {
        var messages = [];

        for (var i = (this.messages.length - 1); i >= 0; i--) {
            var boardMessage = this.messages[i];
            var message = this.room.getMessage(boardMessage.position);

            // Checking if the message object exists
            if (message) {
                var messageCopy = Object.assign({}, message); // Create copy of the original message object
                messageCopy.upVotes = []; // Add up votes array
                messageCopy.downVotes = []; // Add down votes array

                // Loop through the message and sort it into the created arrays for up votes and down votes
                for (var j = (boardMessage.votes.length - 1); j >= 0; j--) {
                    if (boardMessage.votes[j].type === 1) { // Votes equals type 1 (up)
                        messageCopy.upVotes.push(boardMessage.votes[j].userUuid);
                    } else if (boardMessage.votes[j].type === -1) { // Vote equals type -1 (down)
                        messageCopy.downVotes.push(boardMessage.votes[j].userUuid);
                    }
                }

                messages.push(messageCopy);
            }
        }

        // User is undefined. Send the board to all clients inside the room
        if (user == undefined ) {
            this.room.notify("board", {
                "type": "LIST",
                "messages": messages,
            });
        } else {
            user.getConnection().sendPacket("board", {
                "type": "LIST",
                "messages": messages
            });
        }
    }

    // Snapshots
    createSnapshot() {
        var snapshot = { 
            messages: this.messages
        };

        return snapshot;
    }
    loadSnapshot(snapshot) {
        if (snapshot.messages) {
            this.messages = snapshot.messages;
        }
    }
}