import React, { Component } from "react";
import socketIOClient from "socket.io-client";
import Authenticator from "./components/Authenticator/Authenticator";
import Sidebar from "./components/Sidebar/Sidebar";
import Board from "./components/Board/Board";
import Chat from "./components/Chat/Chat";
import Detail from "./components/Detail/Detail";

class App extends Component {
    constructor(props) {
        super(props);

        const socket = socketIOClient("localhost:5000");

        this.state = {
            socket: socket,
            connected: false,

            uuid: -1,

            show: true,
            sidebarOpen: false,
            boardOpen: false,
            detailOpen: false
        }
    }

    componentDidMount() {
        var socket = this.state.socket;

        var self = this;

        // Register all listeners before sending the handshake
        socket.on("handshake", function(data) {
            var json = JSON.parse(data);

            try {
                self.setState({ connected: true, show: true });

                if (json.state == 1) {
                    socket.emit("login");
                }
            } catch (error) {
                console.log(error);
            }
        });
        socket.on("login", function(data) {
            var json = JSON.parse(data);

            try {
                console.log("Login result: " + json.state);

                switch (json.state) {
                    // TODO: Handle all the erros and communicate with the client
                    case "SUCCESS":
                        if (json.uuid !== undefined) {
                            self.setState({ connected: true, show: false, uuid: json.uuid }); 
                        }
                        break;
                }
            } catch (error) {
                console.log(error);
            } 
        });

        // Handle disconnected
        socket.on("disconnect", function() {
            self.setState({ connected: false, show: true });
        });

        // Send handshake.
        var sendHandshake = function() {
            // Generate short delay to improve experience and performance
            setTimeout(function() {
                socket.emit("handshake");
            }, 500);
        }

        socket.on("reconnect", function() {
            sendHandshake();
        });

        sendHandshake();
    }

    render() {
        return (
            <div className="layout">
                <div className={ (this.state.connected ? "backdrop fade-out" : "backdrop visible fade-in") }>
                    <span className="backdrop-spinner"></span>
                </div>
                <Authenticator 
                    socket={ this.state.socket }
                    show={ this.state.show } 
                    setShow={ () => { this.setState({ "show": !this.state.show }) } }
                    connected={ this.state.connected }>
                </Authenticator>
                { !this.state.show && <Sidebar 
                    socket={ this.state.socket }
                    open={ this.state.sidebarOpen } 
                    toggle={ () =>  this.setState({ "sidebarOpen": !this.state.sidebarOpen }) }>
                </Sidebar> }
                <main>
                    { !this.state.show && <Board 
                        socket={ this.state.socket }
                        open={ this.state.boardOpen }
                        close={ () => { this.setState({ "boardOpen": false }) } }>
                    </Board> }
                    { !this.state.show && <Chat 
                        socket={ this.state.socket }
                        screen={ this.state.screen }
                        toggleSidebar={ () => this.setState({ "sidebarOpen": !this.state.sidebarOpen }) } 
                        toggleBoard={ () => this.setState({ "boardOpen": !this.state.boardOpen }) }
                        toggleDetail={ () => this.setState({ "detailOpen": !this.state.detailOpen }) }
                        uuid={ this.state.uuid } >
                    </Chat> }
                    { !this.state.show && <Detail 
                        socket={ this.state.socket }
                        open={ this.state.detailOpen }
                        close={ () => { this.setState({ "detailOpen": false }) } } >
                    </Detail> }
                </main>
            </div>
        );
    }
};

export default App;