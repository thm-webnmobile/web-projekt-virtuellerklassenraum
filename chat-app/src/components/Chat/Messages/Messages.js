import React, { Component } from "react";

import 'bootstrap/dist/css/bootstrap.min.css';

function UserMessage(props) {
    if (props.message == null || props.message == undefined) {
        return null;
    }

    return (
        <div className={ (props.uuid == props.message.uuid ? "message right" : "message") }>
            <div className="message-avatar">
                <div className="avatar" style={{ backgroundColor: props.color }}><span className="avatar-title">{props.message.name.charAt(0)}</span></div>
                <div>
                    <div className="name" style={{ color: props.color }}><b>{props.message.name}</b></div>
                    <div className="time"><i><time>{props.message.time}</time></i></div>
                </div>
            </div>
            <div className="message-content">
                { props.message.messages.flatMap((msg, i) => [
                    renderMessage(msg, i, props.socket, props.position)
                ])}
            </div>
        </div>);
}

function renderMessage(msg, i, socket, position) {
    if (msg == undefined || msg == null) {
        return;
    }

    if (msg.startsWith("data:image/png")) {
        return <img key={i} className="message-image" src={msg}></img>
    }

    return <p key={i} onClick={ function() { socket.emit("board", JSON.stringify({ "type": "ADD", "position": (position + i) })) } }>{msg}</p>;
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

        this.state = {
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
    }

    render() {
        return (
            <div className="messages">
                { this.props.messages.flatMap((message, index) => [
                    <a key={index}>
                        <UserMessage message={ (message.type === "USER" ? message : null) } uuid={ this.props.uuid } socket={ this.props.socket } position={ message.position } color={ this.state.colors[message.color % this.state.colors.length] }></UserMessage>
                        <SystemMessage message={ (message.type === "SYSTEM" ? message : null) }></SystemMessage>
                    </a>
                ])}
            </div>
        );
    }
};

export default Messages;