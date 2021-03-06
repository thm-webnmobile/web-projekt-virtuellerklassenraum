import React, { Component } from "react";
import Form from "react-bootstrap/Form"
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Button from "react-bootstrap/Button";

class Sidebar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            rooms: []
        }

        this.register(props.socket);
    }

    register(socket) {
        var self = this;

        socket.on("rooms", function(data) {
            var rooms = JSON.parse(data);
            self.setState({ rooms: rooms });
        });
    }

    handleSubmit(event) {
        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;

        this.props.socket.emit("join", JSON.stringify({
            "room": form.elements.room.value
        }));
    }

    handleJoin(uuid) {
        this.props.toggle();
        this.props.socket.emit("join", JSON.stringify({
            "room": uuid
        }));
    }

    render() {
        return (
            <aside>
                <div className={ "sidebar" + (this.props.open ? " open" : "") }>
                    <div className="sidebar-head">
                        <div className="sidebar-logo">
                            <span>Virtual Classroom</span>
                        </div>
                        <div className="sidebar-profile">
                            <div className="sidebar-avatar">{ this.props.name.substring(0, 1) }</div>
                            <h6>{ this.props.name }</h6>
                        </div>
                        <div className="sidebar-form">
                            <Form onSubmit={ this.handleSubmit.bind(this) }>
                                <InputGroup className="mb-3">
                                    <FormControl name="room" placeholder="Room ID" />
                                </InputGroup>
                                <Button type="submit" variant="block" className="btn-primary">Join</Button>
                            </Form>
                        </div>
                    </div>
                    <div className="sidebar-body">
                        <div className="sidebar-rooms">
                            <ul>
                                {this.state.rooms.flatMap((room, index) => [
                                    <li onClick={ () => this.handleJoin(room) } key={ index }>{ room }</li>
                                ])}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className={ "sidebar-backdrop" + (this.props.open ? " open" : "") } onClick={ this.props.toggle.bind(this) }></div>
            </aside>
        );
    }
};

export default Sidebar;