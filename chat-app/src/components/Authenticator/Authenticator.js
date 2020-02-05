import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

class Authenticator extends Component {
    constructor(props) {
        super(props);
    }

    handleSubmit(event) {
        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;

        this.props.socket.emit("login", JSON.stringify({
            "name": form.elements.name.value,
            "room": form.elements.room.value
        }));
    }

    render() {
        const windowUrl = window.location.search;
        const params = new URLSearchParams(windowUrl);

        var room = "ID"

        if (params.has("qr")) {
            room = params.get("qr");
        }

        return (
            <Modal show={this.props.connected && this.props.show}>
                <Modal.Body>
                    <div className="auth-header">
                        <h1>Virtual Classroom</h1>
                        <p>Just enter your name and a room.</p>
                    </div>
                    <Form onSubmit={ this.handleSubmit.bind(this) }>
                        <InputGroup className="mb-3">
                            <FormControl name="name" placeholder="Name" />
                        </InputGroup>
                        <InputGroup className="mb-3">
                            <FormControl name="room" placeholder="Room ID" defaultValue={room} />
                        </InputGroup>
                        <Button type="submit">Enter Room</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        );
    }
};

export default Authenticator;