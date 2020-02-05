import React, { Component } from "react";

class Details extends Component {
    constructor(props) {
        super(props);

        this.state = {
            title: "",
            content: [],
            clients: []
        }

        this.register(props.socket);
    }

    register(socket) {
        var self = this;

        socket.on("detail", function(data) {
            try {
                var json = JSON.parse(data);
                
                self.setState({ name: json.name, title: json.title, content: json.content, clients: json.clients });
            } catch (error) {
                
            }
        });
    }

    render() {
        var QRCode = require('qrcode.react');

        const qrUrl = "http://192.168.178.45:5001?qr=" + this.state.name;
        const qrSize = 250;

        return (
            <div className={ "detail" + (this.props.open ? " open" : "") }>
                <div className="detail-head">
                    <span><b>{ this.state.title }</b></span>
                    <ul>
                        <li>
                            <a className="btn btn-outline-light" onClick={ this.props.close.bind(this) }>
                            <svg className="svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </a>
                        </li>
                    </ul>
                </div>
                <div className="detail-body">
                    <div className="qr-code-container">
                        <QRCode className="qr-code" value={qrUrl} size={qrSize}/>
                    </div>
                    { this.state.content.flatMap((content, index) => [
                        <div className="detail-content" key={index}>
                            <h6>{content.title}</h6>
                            <p>{content.text}</p>
                        </div>
                    ])}
                    <div className="detail-content">
                        <h6>Clientlist</h6>
                        <ul>
                        { this.state.clients.flatMap((client, index) => [
                            <li key={index}>{client.name}</li>
                        ])}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }
};

export default Details;