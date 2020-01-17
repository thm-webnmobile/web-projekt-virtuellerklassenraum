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
        return (
            <Modal show={this.props.connected && this.props.show}>
                <Modal.Body>
                    <Form onSubmit={ this.handleSubmit.bind(this) }>
                        <InputGroup className="mb-3">
                            <FormControl name="name" placeholder="Name" />
                        </InputGroup>
                        <InputGroup className="mb-3">
                            <FormControl name="room" placeholder="Room ID" />
                        </InputGroup>
                        <Button type="submit">Submit form</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        );
    }
};

export default Authenticator;