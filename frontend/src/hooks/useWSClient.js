import { useCallback, useRef, useState } from 'react';
import { WSClient } from '../services/websocket/WSClient';

export const useWSClient = () => {
    const clients = useRef({});
    const [connections, setConnections] = useState({});
    const [isConnecting, setIsConnecting] = useState(false);

    const connect = useCallback(async (endpoint) => {
        if (clients.current[endpoint]?.isConnected) {
            return clients.current[endpoint];
        }

        setIsConnecting(true);
        try {
            if (clients.current[endpoint]) {
                clients.current[endpoint].close();
            }

            const client = new WSClient(`${process.env.REACT_APP_BACKEND_URL || 'ws://localhost:8000'}/ws/${endpoint}`);
            await client.connect();

            clients.current[endpoint] = client;
            setConnections(prev => ({ ...prev, [endpoint]: true }));

            return client;
        } catch (error) {
            setConnections(prev => ({ ...prev, [endpoint]: false }));
            throw error;
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback((endpoint) => {
        if (clients.current[endpoint]) {
            clients.current[endpoint].close();
            delete clients.current[endpoint];
            setConnections(prev => ({ ...prev, [endpoint]: false }));
        }
    }, []);

    return {
        connect,
        disconnect,
        isConnected: (endpoint) => !!connections[endpoint],
        isConnecting,
        getClient: (endpoint) => clients.current[endpoint]
    };
};
