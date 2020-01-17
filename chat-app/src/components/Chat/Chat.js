import React, { Component } from "react";
import MessageBox from "./MessageBox/MessageBox";
import Messages from "./Messages/Messages";
import Button from "react-bootstrap/Button";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";

class Chat extends Component {
    constructor(props) {
        super(props);

        this.state = {
            name: "",
            messages: []
        }

        this.messagesEndRef = React.createRef();
        
        this.register(props.socket);
    }

    register(socket) {
        var self = this;

        // Override chat with history
        socket.on("chat", function(data) {
            try {
                var json = JSON.parse(data);

                switch (json.type) {
                    case "USER":
                    case "SYSTEM":
                        var messages = self.state.messages;
                        messages.push(json);

                        self.setState({ messages: self.wrapMessages(messages) });
                        self.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                        break;
                    case "HISTORY":
                        self.setState({ messages: self.wrapMessages(json.messages) });
                        self.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                        break;
                }
            } catch(error) {
                console.log(error);
            }
        });
    }
    
    // Client calculation to stack previous send message for better viewing
    wrapMessages(messages) {
        var stack = [];

        for (var i = 0; i < messages.length; i++) {
            var message = messages[i];
            var clone = message;

            for (var j = (i + 1); j < messages.length; j++) {
                var nextMessage = messages[j];

                if ((nextMessage.type !== message.type) || (message.time !== nextMessage.time)) {
                    break;
                }

                if (message.uuid != undefined && nextMessage.uuid != undefined && message.uuid === nextMessage.uuid) {
                    nextMessage.messages.forEach(function(element) {
                        clone.messages.push(element);
                    });
                    
                    i++;
                    continue;
                } else {
                    break;
                }
            }

            stack.push(clone);
        }

        console.log(stack);

        return stack;
    }

    sendMessage(message) {
        this.props.socket.emit("chat", JSON.stringify({
            "message": message
        }));
    }

    render() {
        return (
            <div className="chat">
                <div className="chat-head">
                    <div className="chat-head-title">
                        <span><b>Chat { this.state.name }</b></span>
                    </div>
                    <div className="chat-head-action">
                        <ul>
                            <li className="d-xl-none">
                                <Button onClick={ this.props.toggleSidebar }>
                                    <svg className="svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                                </Button>
                            </li>
                            <li className="d-lg-none">
                                <Button onClick={ this.props.toggleBoard  }>
                                    <svg className="svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                </Button>
                            </li>
                            <li>
                                <DropdownButton alignRight title={ <svg className="svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg> }>
                                    <Dropdown.Item onClick={ this.props.toggleDetail  }>Details</Dropdown.Item>
                                </DropdownButton>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="chat-body">
                    <Messages 
                        uuid={ this.props.uuid }
                        messages={ this.state.messages }
                        socket={ this.props.socket } 
                    />
                    <div ref={ this.messagesEndRef }></div>
                </div>
                <div className="chat-footer">
                    <MessageBox 
                        onSendMessage={ this.sendMessage.bind(this) } 
                    />
                </div>
            </div>
        );
    }
};

export default Chat;