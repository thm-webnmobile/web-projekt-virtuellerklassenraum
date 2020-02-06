import React, { Component } from 'react';
import { v4 } from 'uuid';
import Button from "react-bootstrap/Button";

    class Canvas extends Component {
        constructor(props) {
            super(props);
            this.onMouseDown = this.onMouseDown.bind(this);
            this.onMouseMove = this.onMouseMove.bind(this);
            this.endPaintEvent = this.endPaintEvent.bind(this);

            this.state = {
                color: 'rgba(0, 250, 0, 0.5)',
                width: 3
            }

            this.isPainting = false;
        
            // Different stroke styles to be used for user and guest
            this.line = [];

            // v4 creates a unique id for each user. We used this since there's no auth to tell users apart
            this.userId = v4();
            this.prevPos = { offsetX: 0, offsetY: 0 };

            this.colors = [
                "#1abc9c",
                "#16a085",
                "#2ecc71",
                "#27ae60",
                "#3498db",
                "#2980b9",
                "#9b59b6",
                "#8e44ad",
                "#34495e",
                "#2c3e50",
                "#f1c40f",
                "#f39c12",
                "#e67e22",
                "#d35400",
                "#e74c3c",
                "#c0392b"
            ];

            this.register(props.socket);
        }

        register(socket) {
            var self = this;
    
            socket.on("paint", function(data) {
                try {
                    var json = JSON.parse(data);

                    for (var i = 0; i < json.line.length; i++) {
                        var line = json.line[i];

                        self.paint(line.start, line.stop, line.color, line.width);
                    }
                } catch(error) {
                    console.log(error);
                }
            });

            socket.on("canvas", function(data) {
                try {
                    var json = JSON.parse(data);

                    switch(json.type) {
                        case 'RESET':
                            if (self.ctx && self.canvas) {
                                self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
                            }
                            break;
                    }
                } catch(error) {
                    console.log(error);
                }
            });
        }

        onMouseDown({ nativeEvent }) {
            try {
                var rect = nativeEvent.target.getBoundingClientRect();

                const offsetX = nativeEvent.offsetX || nativeEvent.touches[0].pageX - rect.left;
                const offsetY = nativeEvent.offsetY || nativeEvent.touches[0].pageY - rect.top;

                this.isPainting = true;
                this.prevPos = { offsetX, offsetY };

                if (nativeEvent.offsetX && nativeEvent.offsetY) {
                    nativeEvent.preventDefault();
                }

                nativeEvent.stopImmediatePropagation();
            } catch (error) {
                console.log(error);
            }
        }

        onMouseMove({ nativeEvent }) {
            try {
                if (this.isPainting) {
                    var rect = nativeEvent.target.getBoundingClientRect();

                    const offsetX = nativeEvent.offsetX || nativeEvent.touches[0].pageX - rect.left;
                    const offsetY = nativeEvent.offsetY || nativeEvent.touches[0].pageY - rect.top;
                    
                    const offSetData = { offsetX, offsetY };
                
                    // Set the start and stop position of the paint event.
                    const positionData = {
                        start: { ...this.prevPos },
                        stop: { ...offSetData },
                        color: this.state.color,
                        width: this.state.width
                    };
                
                    // Add the position to the line array
                    this.line = this.line.concat(positionData);
                    this.paint(this.prevPos, offSetData, this.state.color, this.state.width);
                }
 
                nativeEvent.stopImmediatePropagation();

                if (nativeEvent.offsetX && nativeEvent.offsetY) {
                    nativeEvent.preventDefault();
                }
            } catch (error) {
                console.log(error);
            }
        }

        endPaintEvent() {
            if (this.isPainting) {
                this.isPainting = false;
                this.sendPaintData();
            }
        }

        paint(prevPos, currPos, color, width) {
            const { offsetX, offsetY } = currPos;
            const { offsetX: x, offsetY: y } = prevPos;

            this.ctx.beginPath();
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = width;

            // Move the the prevPosition of the mouse
            this.ctx.moveTo(x, y);
            
            // Draw a line to the current position of the mouse
            this.ctx.lineTo(offsetX, offsetY);
            
            // Visualize the line using the strokeStyle
            this.ctx.stroke();
            this.prevPos = { offsetX, offsetY };
        }

        sendPaintData() {
            const body = {
                line: this.line,
                userId: this.userId,
            };

            this.props.socket.emit("paint", JSON.stringify(body));

            this.line = [];
        }

        componentDidMount() {
            // Here we set up the properties of the canvas element. 
            this.canvas.width = 400;
            this.canvas.height = 250;
            this.ctx = this.canvas.getContext('2d');
            this.ctx.lineJoin = 'round';
            this.ctx.lineCap = 'round';
            this.ctx.lineWidth = this.state.width;
        }

        setColor(color) {
            this.setState({ color: color });
        }

        setWidth(width) {
            this.setState({ width: width });
        }

        resetPainting() {
            if (this.canvas) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                this.props.socket.emit("canvas", JSON.stringify({
                    "type": "RESET"
                }));
            }
        }

        sendPainting() {
            this.props.toggle();

            var image = this.canvas.toDataURL("image/png");
            
            this.resetPainting();

            this.props.socket.emit("chat", JSON.stringify({
                "message": image,
                "type": "IMAGE"
            }));
        }

        render() {
            return (
                <div className="chat-canvas-container">
                    <div className="tool-palette">
                        <div className="tool-box">
                            <div className="tool">
                                <svg id="pencil-svg" onClick={ () => this.setWidth(2) } className="tool-button" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                                    <g fill="none" fillRule="evenodd">
                                        <path className="pencil-tip" fill={ this.state.color } d="M95.37 16.765A.777.777 0 0 0 96 16a.777.777 0 0 0-.63-.765L89.418 13a10.989 10.989 0 0 0 0 6l5.953-2.235z"></path>
                                        <path className="pencil-collar" d="M67.133 5l1.5 2.422c.212.378.102.792-.156 1.098 0 0-1.435 1.76-2.18 2.389a.77.77 0 0 0-.213.961l2.15 3.43a1.544 1.544 0 0 1 .002 1.4l-2.152 3.43a.77.77 0 0 0 .217.962c.754.62 2.176 2.388 2.176 2.388.258.307.368.72.156 1.098L67.133 27l15.038-5.486 5.882-2.13.947-.343a10.766 10.766 0 0 1 0-6.079l-.947-.343-5.882-2.13L67.133 5z"></path>
                                        <path className="pencil-dark-handle" d="M66.7 20.115l2.132-3.418h.002a1.545 1.545 0 0 0 0-1.394h-.002L66.7 11.885a.77.77 0 0 1 .133-.885H4v10h62.833a.77.77 0 0 1-.133-.885"></path>
                                        <path className="pencil-light-handle" d="M66.595 10.92c.764-.594 2.141-2.398 2.141-2.398.254-.306.363-.72.153-1.097L67.41 5.006 4.021 5 4 11h62.509a.786.786 0 0 1 .086-.08M66.596 21.095c.742.622 2.14 2.383 2.14 2.383.254.306.363.72.153 1.097l-1.48 2.419L4.022 27 4 21h62.5c.027.028.064.068.096.095"></path>
                                    </g>
                                </svg>
                            </div>
                            <div className="tool">
                                <svg id="marker-svg" onClick={ () => this.setWidth(6) } className="tool-button" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                                    <g fill="none" fillRule="evenodd">
                                        <path className="marker-dark-handle" d="M58.903 29.146l-.04-.232a56.35 56.35 0 0 1-.096-.584l-.04-.256a75.309 75.309 0 0 1-.123-.845 55.045 55.045 0 0 1-.113-.865c-.154-1.237-.28-1.984-.376-3.364H4v6.953h54.766c.095 0 .188-.014.28-.035-.05-.252-.097-.51-.143-.772z"></path>
                                        <path className="marker-light-handle" d="M58.125 9.531a87.665 87.665 0 0 0-.21 4.744l-.003.231a96.894 96.894 0 0 0 0 3.059l.003.234c.009.494.021.983.037 1.466l.006.14c.036 1.036.089 2.617.157 3.595H4V2h54.766c.105 0 .208.018.308.044-.05.251-.098.51-.145.772l-.04.232c-.033.191-.066.384-.098.58l-.042.268a72.302 72.302 0 0 0-.126.849l-.09.663-.026.205c-.034.27-.066.543-.098.82l-.009.076a75.61 75.61 0 0 0-.275 3.022z"></path>
                                        <path className="marker-tip" fill={ this.state.color } d="M89.184 19.626c1.021 0 2.03-.216 2.95-.633l4.1-1.857a1.24 1.24 0 0 0 0-2.292l-4.101-1.858a7.135 7.135 0 0 0-2.95-.616H84.61v7.256h4.575z"></path>
                                        <path className="marker-socket" d="M68.087 23h14.759a.62.62 0 0 0 .269-.062l1.519-1.298a.635.635 0 0 0 .352-.658 30.162 30.162 0 0 1-.138-1.356 46.8 46.8 0 0 1-.149-3.65c0-1.147.052-2.45.147-3.623.04-.487.086-.953.14-1.374a.636.636 0 0 0-.352-.658l-1.52-1.259a.625.625 0 0 0-.268-.06H68.087l-8.492-6.687a1.252 1.252 0 0 0-.52-.271c-.05.25-.099.51-.146.772l-.04.232c-.033.191-.066.383-.098.58l-.042.268a60.752 60.752 0 0 0-.215 1.512l-.027.205a76.112 76.112 0 0 0-.382 3.918 88.432 88.432 0 0 0-.21 4.744l-.003.231a96.943 96.943 0 0 0-.001 3.059l.004.234c.009.494.021.983.038 1.466l.005.14c.036 1.036.089 2.046.157 3.025a74.052 74.052 0 0 0 .49 4.799l.032.236.09.61.04.255c.032.198.064.392.097.584l.039.232c.046.262.093.52.142.772.202-.047.392-.14.55-.28L68.087 23z"></path>
                                        <path className="marker-accent" d="M95.88 16.433s-3.223 1.645-3.863 1.902c-.661.266-1.14.563-2.765.616-1.625.053-3.367-.015-3.367-.015s-.394-.07-.394-.389c0-.318.485-.392.485-.392l3.633.047s.877-.03 1.282-.214l4.81-1.992s.242-.082.327.133c.073.184-.148.304-.148.304"></path>
                                    </g>
                                </svg>
                            </div>
                            <div className="tool" onClick={ this.resetPainting.bind(this)  }>
                                <svg id="eraser-svg" className="tool-button" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                                    <g fill="none" fillRule="evenodd">
                                        <path className="eraser-tip eraser-shadow" d="M91.256 19.824h-15.39A158.925 158.925 0 0 1 75.5 27.5h16.593c2.394 0 4.407-5.58 4.407-12.463 0-1.603-.077-3.13-.211-4.537-.703 5.36-3.075 9.324-5.033 9.324"></path>
                                        <path className="eraser-tip" d="M91.175 21.5c2.07 0 4.582-4.136 5.325-9.73-.47-4.838-1.906-8.27-4.44-8.27H74.5c.284 3.811.448 8.256.448 13.005 0 1.71-.021 3.38-.061 4.995h16.288z"></path>
                                        <path className="eraser-handle" d="M3.5 3.5v24h76v-24z"></path>
                                        <path className="eraser-shadow" d="M52 27.5H3.5v-6h76v6H52z"></path>
                                        <path className="eraser-ferrule" d="M71.3 27.5s.497-3.903.497-12-.497-12-.497-12M67.7 27.5s.497-3.903.497-12-.497-12-.497-12M64.003 27.5s.497-3.903.497-12-.497-12-.497-12M60.003 27.5s.497-3.903.497-12-.497-12-.497-12" strokeWidth=".817" strokeLinecap="round" strokeLinejoin="round">
                                        </path>
                                    </g>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="canvas">
                        <canvas
                        // We use the ref attribute to get direct access to the canvas element. 
                        ref={(ref) => (this.canvas = ref)}
                        style={{ background: 'rgba(0, 0, 0, 0)' }}
                        onMouseDown={this.onMouseDown}
                        onMouseLeave={this.endPaintEvent}
                        onMouseUp={this.endPaintEvent}
                        onMouseMove={this.onMouseMove}
                        onTouchStart={this.onMouseDown}
                        onTouchCancel={this.endPaintEvent}
                        onTouchEnd={this.onMouseUp}
                        onTouchMove={this.onMouseMove}
                        />
                    </div>
                    <div className="chat-canvas-control">
                        { this.colors.flatMap((color, index) => [
                            <a key={index}>
                                <div className="chat-canvas-color" onClick={ () => this.setColor(color)  } style={{backgroundColor: color}} />
                            </a>
                        ])}
                    </div>
                    <Button variant="primary" onClick={evt => this.sendPainting()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </Button>
                </div>
            );
        }
    }
    export default Canvas;