import React, { Component } from "react";

import 'bootstrap/dist/css/bootstrap.min.css';

function UserMessage(props) {
    if (props.message == null || props.message == undefined) {
        return null;
    }

    return (
        <div className={ (props.uuid == props.message.uuid ? "message right" : "message") }>
            <div className="message-avatar">
                <div className="avatar"><span className="avatar-title">?</span></div>
                <div>
                    <div className="name"><b>{props.message.name}</b></div>
                    <div className="time"><i><time>{props.message.time}</time></i></div>
                </div>
            </div>
            <div className="message-content">
                { props.message.messages.flatMap((msg, i) => [
                    <p key={i} onClick={ function() { props.socket.emit("board", JSON.stringify({ "type": "ADD", "position": (props.position + i) })) } }>{msg}</p>
                ])}
            </div>
        </div>);
}
function SystemMessage(props) {
    if (props.message == null || props.message == undefined) {
        return null;
    }

    return (
        <div className="message system">
            <div className="message-content">
                { props.message.messages.flatMap((msg, i) => [
                    <p key={i}>{msg}</p>
                ])}
            </div>
        </div>);
}

class Messages extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="messages">
                { this.props.messages.flatMap((message, index) => [
                    <a key={index}>
                        <UserMessage message={ (message.type === "USER" ? message : null) } uuid={ this.props.uuid } socket={ this.props.socket } position={ message.position }></UserMessage>
                        <SystemMessage message={ (message.type === "SYSTEM" ? message : null) }></SystemMessage>
                    </a>
                ])}
            </div>
        );
    }
};

export default Messages;