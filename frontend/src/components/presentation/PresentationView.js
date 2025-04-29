import React, { useState, useEffect, useCallback, useRef } from 'react';
import './PresentationView.css';
import { useSlideWebSocket } from '../../hooks/useSlideWebSocket';
import SlideControlWrapper from './SlideControlWrapper';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useWSClient } from '../../hooks/useWSClient';

const PresentationView = ({ id, slides }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isContextMode, setIsContextMode] = useState(false);
    const [isKeywordMode, setIsKeywordMode] = useState(false);
    const { isRecording, startRecording, stopRecording } = useAudioRecorder();
    const { connect, disconnect } = useWSClient();
    const wsClient = useRef(null);

    const showSlide = useCallback((index) => {
        setCurrentSlide((prev) => {
            if (index >= slides.length) {
                return 0;
            } else if (index < 0) {
                return slides.length - 1;
            } else {
                return index;
            }
        });
    }, [slides.length]);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => {
            const next = prev + 1;
            return next >= slides.length ? 0 : next;
        });
    }, [slides.length]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => {
            const prevIndex = prev - 1;
            return prevIndex < 0 ? slides.length - 1 : prevIndex;
        });
    }, [slides.length]);

    const handleContextMode = useCallback(() => {
        setIsContextMode(prev => !prev);
        console.log('Тоглим режим контекста ' + isContextMode);
    }, [isContextMode]);

    const handleKeywordMode = useCallback(() => {
        setIsKeywordMode(prev => !prev);
        console.log('Тоглим режим ключевых слов ' + isKeywordMode);
    }, [isKeywordMode]);

    const slideWsClientRef = useSlideWebSocket(showSlide, nextSlide, prevSlide);

    const sendModeUpdate = useCallback(() => {
        if (slideWsClientRef.current?.isConnected) {
            const message = JSON.stringify({
                isContextMode,
                isKeywordMode,
                currentSlide
            });
            slideWsClientRef.current.send(message);
        }
    }, [slideWsClientRef, isContextMode, isKeywordMode, currentSlide]);

    const handleRecordToggle = useCallback(async () => {
        if (!isRecording) {
            try {
                wsClient.current = await connect('asr');
                wsClient.current.send(id);
                await startRecording((data) => {
                    if (wsClient.current?.isConnected) {
                        wsClient.current.send(data);
                    }
                });
            } catch (error) {
                console.error('Ошибка запуска записи:', error);
                stopRecording();
                disconnect('asr');
            }
        } else {
            stopRecording();
            disconnect('asr');
            wsClient.current?.close();
            wsClient.current = null;
        }
    }, [isRecording, startRecording, stopRecording, connect, disconnect]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'ArrowLeft') prevSlide();
            else if (event.key === 'ArrowRight') nextSlide();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [prevSlide, nextSlide]);

    useEffect(() => {
        sendModeUpdate();
    }, [isContextMode, isKeywordMode, currentSlide, sendModeUpdate]);


    return (
        <div className="slideshow-container">
            <div className="slides" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {slides.map((slide, index) => (
                    <div key={index} className="slide" dangerouslySetInnerHTML={{ __html: slide.innerHTML }} />
                ))}
            </div>
            <SlideControlWrapper
                onPrev={prevSlide}
                onNext={nextSlide}
                isRecording={isRecording}
                onToggleRecording={handleRecordToggle}
                currentSlide={currentSlide}
                totalSlides={slides.length}
                onToggleContextMode={handleContextMode}
                onToggleKeywordMode={handleKeywordMode}
                isKeywordMode={isKeywordMode}
                isContextMode={isContextMode}
            />
        </div>
    );
};

export default PresentationView;
