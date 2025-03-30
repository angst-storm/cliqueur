export class WSClient {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.isConnected = false;
        this.pendingMessages = [];
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(this.url);

            this.socket.onopen = () => {
                this.isConnected = true;
                this.pendingMessages.forEach(msg => this.send(msg.data));
                this.pendingMessages = [];
                resolve();
            };

            this.socket.onerror = (error) => {
                this.isConnected = false;
                reject(error);
            };

            this.socket.onclose = () => {
                this.isConnected = false;
            };
        });
    }

    send(data) {
        if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(data);
        } else {
            this.pendingMessages.push({ data });
        }
    }

    close() {
        if (this.socket) {
            this.socket.close();
            this.isConnected = false;
        }
    }
}