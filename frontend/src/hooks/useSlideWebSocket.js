import { useEffect, useRef } from 'react';
import { useWSClient } from './useWSClient';

export const useSlideWebSocket = (showSlide,nextSlide, prevSlide) => {
    const { connect, disconnect } = useWSClient();
    const wsClientRef = useRef(null);


    useEffect(() => {
        const setupWebSocket = async () => {
            if (!wsClientRef.current) {
                wsClientRef.current = await connect('slides');
                wsClientRef.current.onMessage((message) => {
                    const trimmedMessage = message.trim();

                    if (trimmedMessage === '+') {
                        nextSlide();
                    } else if (trimmedMessage === '-') {
                        prevSlide();
                    } else {
                        const slideNumber = parseInt(trimmedMessage, 10);
                        if (!isNaN(slideNumber)) {
                            showSlide(slideNumber);
                        }
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
    }, [connect, disconnect]);

    return wsClientRef;
};
