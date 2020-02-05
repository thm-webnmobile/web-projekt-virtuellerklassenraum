import React, { useState, Component } from "react";
import Form from "react-bootstrap/Form"
import Button from "react-bootstrap/Button";

class MessageBox extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="message-form">
                <div className="message-form-buttons">
                    <Button variant="primary" onClick={evt => this.props.onToggleSlideout()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                    </Button>
                </div>
                <div className="message-form-buttons">
                    <Button variant="primary" onClick={evt => this.props.onToggleCanvas()}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    </Button>
                </div>
                <div className="message-form-control">
                    <Form.Control 
                        id="message-box"
                        type="text" 
                        placeholder="Message" 
                        onChange={evt => this.props.onSetMessage(evt.target.value)}
                        onKeyDown={evt => {
                            if (evt.key === "Enter") {
                                evt.preventDefault();
                                this.props.onSendMessage();
                                this.props.onSetMessage("");
                            }
                        }}
                        value={this.props.message}
                    />
                </div>
                <div className="message-form-buttons">
                    <Button variant="primary" onClick={evt => this.props.onSendMessage()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </Button>
                </div>
            </div>
        );
    }
}

export default MessageBox;