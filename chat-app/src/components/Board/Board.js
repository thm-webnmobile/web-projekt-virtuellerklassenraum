import React, { Component } from "react";
import Form from "react-bootstrap/Form"

class Board extends Component {
    constructor(props) {
        super(props);

        this.state = {
            messages: [],
            uuid: props.uuid,
            showMessage: -1,
            colors: [
                "#55efc4", 
                "#81ecec", 
                "#74b9ff",
                "#a29bfe",
                "#ffeaa7",
                "#fab1a0",
                "#ff7675",
                "#fd79a8"
            ]
        }

        this.register(props.socket);
    }

    register(socket) {
        var self = this;

        // Override chat with history
        socket.on("board", function(data) {
            try {
                var json = JSON.parse(data);

                if (json.type === "LIST") {
                    self.setState({ messages: self.sortMessages(json.messages) });
                }
            } catch (error) {
                console.log(error);
            }
        });
    }

    sortMessages(messages) {
        function compare(a, b) {
            var scoreA = ((a.upVotes.length * 1.2) - (a.downVotes.length * 0.8));
            var scoreB = ((b.upVotes.length * 1.2) - (b.downVotes.length * 0.8));

            return scoreB - scoreA;
        }

        for (var i = 0; i < messages.length; i++) {
            for (var j = 0; j < messages[i].downVotes.length; j++) {
                if (messages[i].downVotes[j].toString() == this.state.uuid.toString()) {
                    messages[i].downVoted = true;
                }
            }
            for (var j = 0; j < messages[i].upVotes.length; j++) {
                if (messages[i].upVotes[j].toString() == this.state.uuid.toString()) {
                    messages[i].upVoted = true;
                }
            }
        }

        return messages.sort(compare);
    }

    removeMessage(message) {
        this.props.socket.emit("board", JSON.stringify({
            "type": "REMOVE",
            "position": message.position
        }));
    }

    upVoteMessage(message) {
        this.props.socket.emit("board", JSON.stringify({
            "type": "UP_VOTE",
            "position": message.position
        }));
    }

    downVoteMessage(message) {
        this.props.socket.emit("board", JSON.stringify({
            "type": "DOWN_VOTE",
            "position": message.position
        }));
    }

    showMessage(index) {
        if (this.state.showMessage == index) {
            index = -1;
        }

        this.setState({ showMessage: index });
    }

    render() {
        return (
            <div className={ "board" + (this.props.open ? " open" : "") }>
                <div className="board-head">
                    <span><b>Board</b></span>
                    <ul>
                        <li className="d-md-none" onClick={ this.props.close.bind(this) }>
                            <a className="btn btn-outline-light">
                                <svg className="svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </a>
                        </li>
                    </ul>
                </div>
                <div className="board-body">
                    <ul>
                        { this.state.messages.flatMap((message, index) => [
                            <li key={index}>
                                <span className="bb-avatar" style={{ backgroundColor: this.state.colors[message.color % this.state.colors.length] }}>{ message.name.charAt(0) }</span>
                                <div className={ this.state.showMessage == index ? "bb-body full" : "bb-body" }>
                                    <div className="bb-name">
                                        <b style={{ color: this.state.colors[message.color % this.state.colors.length] }}>{ message.name }</b>
                                        <time onClick={ () => this.removeMessage(message) }>{message.time}</time>
                                        <span className={ message.downVoted ? 'bb-vote down-vote' : 'bb-vote down-vote own' } onClick={ () => this.downVoteMessage(message) } style={{ opacity: message.downVoted ? 0.5 : 1 }}>{ message.downVotes.length }</span>
                                        <span className={ message.upVoted ? 'bb-vote up-vote' : 'bb-vote up-vote own' } onClick={ () => this.upVoteMessage(message) }  style={{ opacity: message.upVoted ? 0.5 : 1 }}>{ message.upVotes.length }</span>
                                    </div>
                                    <p onClick={ () => this.showMessage(index) }>{ message.messages[0] }</p>
                                </div>
                            </li>
                        ])}
                    </ul>
                </div>
                <div className="board-toggler" onClick={ () => setBoardOpen(!boardOpen) }></div>
            </div>
        );
    }
};

export default Board;