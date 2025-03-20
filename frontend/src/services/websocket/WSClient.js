export class WSClient {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.isConnected = false;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(this.url);

            this.socket.onopen = () => {
                this.isConnected = true;
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
            if (data instanceof Blob) {
                this.socket.send(data);
            } else {
                this.socket.send(JSON.stringify(data));
            }
        }
    }

    close() {
        this.socket?.close();
    }
}