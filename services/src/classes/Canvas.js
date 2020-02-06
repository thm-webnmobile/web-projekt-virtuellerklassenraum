const Board = require('./Board');

const internal = {};

module.exports = internal.Canvas = class {
    constructor(server, uuid) {
        this.uuid = uuid;
        this.server = server;
        this.userUuids = [];
        this.lines = [];
    }

    getUuid() {
        return this.uuid;
    }

    join(user) {
        user.setCanvasUuid(this.uuid);
        user.getConnection().sendPacket("canvas", { "type": "RESET", "uuid": this.uuid });

        if (this.userUuids.indexOf(user.getUuid()) == -1) {
            this.userUuids.push(user.getUuid()); 
        }

        for (var i = 0; i <this.lines.length; i++) {
            user.getConnection().sendRawPacket("paint", this.lines[i]);
        }

        if (this.uuid != user.getUuid()) {
            user.getConnection().sendPacket("canvas", { "type": "OPEN", "uuid": this.uuid });
        }
    }

    leave(user) {
        var canvas = this.server.createCanvas(user.getUuid());
        canvas.join(user);
    
        var index = this.userUuids.indexOf(user.getUuid());

        if (index != -1) {
           this.userUuids.splice(index, 1);
        }
    }

    reset() {
        this.lines = [];

        var self = this;

        this.userUuids.forEach(function(uuid) {
            var user = self.server.findUser(uuid);

            if (user && user.getCanvasUuid() == self.uuid) {
                user.getConnection().sendPacket("canvas", { "type": "RESET", "uuid": self.uuid });
            }
        });
    }

    send(data, user = undefined) {
        this.lines.push(data);

        this.notify("paint", data);
    }

    notify(channel, data) {
        var self = this;

        this.userUuids.forEach(function(uuid) {
            var user = self.server.findUser(uuid);

            if (user && user.getCanvasUuid() == self.uuid) {
                user.getConnection().sendRawPacket(channel, data);
            }
        });
    }
}