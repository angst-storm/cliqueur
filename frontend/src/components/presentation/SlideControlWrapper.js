import React, { useState, useEffect, useRef } from 'react';
import SlideControlPanel from './SlideControlPanel';
import './SlideControlPanel.css';

const SlideControlWrapper = ({
                                 onPrev,
                                 onNext,
                                 onToggleRecording,
                                 isRecording,
                                 currentSlide
                             }) => {
    const [visible, setVisible] = useState(false);
    const timeoutRef = useRef(null);
    const zoneRef = useRef(null);

    const showPanel = () => {
        clearTimeout(timeoutRef.current);
        setVisible(true);
    };

    const hidePanel = () => {
        timeoutRef.current = setTimeout(() => {
            setVisible(false);
        }, 2000); // скрытие через 2 секунды
    };

    useEffect(() => {
        const zone = zoneRef.current;

        const handleMouseEnter = () => showPanel();
        const handleMouseLeave = () => hidePanel();

        zone.addEventListener('mouseenter', handleMouseEnter);
        zone.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            zone.removeEventListener('mouseenter', handleMouseEnter);
            zone.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div className="control-zone" ref={zoneRef}>
            {visible && (
                <SlideControlPanel
                    onPrev={onPrev}
                    onNext={onNext}
                    onToggleRecording={onToggleRecording}
                    isRecording={isRecording}
                    currentSlide={currentSlide}
                />
            )}
        </div>
    );
};

export default SlideControlWrapper;
