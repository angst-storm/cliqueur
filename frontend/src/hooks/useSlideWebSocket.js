import { useEffect, useRef } from 'react';
import { useWSClient } from './useWSClient';

export const useSlideWebSocket = (showSlide) => {
    const { connect, disconnect, getClient } = useWSClient();
    const wsClientRef = useRef(null);

    useEffect(() => {
        const setupWebSocket = async () => {
            if (!wsClientRef.current) {
                wsClientRef.current = await connect('slides');
                wsClientRef.current.onMessage((message) => {
                    const slideNumber = parseInt(message, 10);
                    if (!isNaN(slideNumber)) {
                        showSlide(slideNumber);
                    }
                });
            }
        };

        setupWebSocket();

        return () => {
            if (wsClientRef.current) {
                disconnect('slides');
                wsClientRef.current = null;
            }
        };
    }, [connect, disconnect, showSlide]);
};
