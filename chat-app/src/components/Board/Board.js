import React, { Component } from "react";
import Form from "react-bootstrap/Form"

class Board extends Component {
    constructor(props) {
        super(props);

        this.state = {
            messages: []
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
                    self.setState({ messages: json.messages });
                }
            } catch (error) {
                console.log(error);
            }
        });
    }

    removeMessage(message) {
        this.props.socket.emit("board", JSON.stringify({
            "type": "REMOVE",
            "position": message.position
        }));
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
                            <li key={index} onClick={ () => this.removeMessage(message) }>{ message.messages[0] }</li>
                        ])}
                    </ul>
                </div>
                <div className="board-toggler" onClick={ () => setBoardOpen(!boardOpen) }></div>
            </div>
        );
    }
};

export default Board;