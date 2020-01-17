import React, { useState } from "react";
import Form from "react-bootstrap/Form"
import Button from "react-bootstrap/Button";

const MessageBox = ({ onSendMessage: pushSendMessage }) => {
    const [message, setMessage] = useState("");

    return (
        <div className="message-form">
            <div className="message-form-control">
                <Form.Control 
                    type="text" 
                    placeholder="Message" 
                    onChange={evt => setMessage(evt.target.value)}
                    onKeyDown={evt => {
                        if (evt.key === "Enter") {
                            evt.preventDefault();
                            pushSendMessage(message);
                            setMessage("");
                        }
                    }}
                    value={message}
                />
            </div>
            <div className="message-form-buttons">
                <Button variant="primary" onClick={evt => pushSendMessage(message)}>
                    <svg className="svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </Button>
            </div>
        </div>
    );
};

export default MessageBox;