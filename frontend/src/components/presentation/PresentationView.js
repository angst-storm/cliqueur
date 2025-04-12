import React, { useState, useEffect, useCallback, useRef } from 'react';
import './PresentationView.css';
import { useSlideWebSocket } from '../../hooks/useSlideWebSocket';
import SlideControlWrapper from './SlideControlWrapper';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useWSClient } from '../../hooks/useWSClient';

const PresentationView = ({ slides }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const { isRecording, startRecording, stopRecording } = useAudioRecorder();
    const { connect, disconnect } = useWSClient();
    const wsClient = useRef(null);

    const showSlide = useCallback((index) => {
        if (index >= slides.length) {
            setCurrentSlide(0);
        } else if (index < 0) {
            setCurrentSlide(slides.length - 1);
        } else {
            setCurrentSlide(index);
        }
    }, [slides.length]);

    const nextSlide = useCallback(() => {
        showSlide(currentSlide + 1);
    }, [currentSlide, showSlide]);

    const prevSlide = useCallback(() => {
        showSlide(currentSlide - 1);
    }, [currentSlide, showSlide]);

    const handleRecordToggle = useCallback(async () => {
        if (!isRecording) {
            try {
                wsClient.current = await connect('asr');
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

    useSlideWebSocket(showSlide);

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
            />
        </div>
    );
};

export default PresentationView;
