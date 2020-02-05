const Board = require('./Board');

const internal = {};

module.exports = internal.Canvas = class {
    constructor(server) {
        this.server = server;
        this.userUuids = [];
        this.lines = [];
    }

    join(user) {
        this.userUuids.push(user.getUuid());
        this.sendLine(this.lines, user);
    }

    leave(user) {
       var index = this.userUuids.indexOf(user.getUuid());

       if (index != -1) {
           this.userUuids.splice(index, 1);
       }
    }

    drawLine(line) {
        this.lines.push(line);

        this.sendLine();
    }

    sendLine(lines, user = undefined) {
        if (user == undefined) {
            for (var i in lines) {
                this.notify("draw", { "line": lines[i] });
            }
        } else {
            for (var i in lines) {
                user.getConnection().sendPacket("draw", { "lines": lines[i] });
            }
        }
    }

    notify(channel, data) {
        if (this.lastUpdate == -1) {
            this.lastUpdate = new Date();
        }

        var self = this;

        this.userUuids.forEach(function(uuid) {
            var user = self.server.findUser(uuid);
            
            // Send only packet to player that is watching this canvas
            if (user) {
                user.getConnection().sendPacket(channel, data);
            }
        })
    }
}