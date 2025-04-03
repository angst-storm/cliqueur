import React, { useState, useEffect, useCallback } from 'react';
import './PresentationView.css';
import { useSlideWebSocket } from '../../hooks/useSlideWebSocket';

const PresentationView = ({ slides }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const showSlide = useCallback((index) => {
        console.log('Переключаем на индекс:', index);
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

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'ArrowLeft') {
                prevSlide();
            } else if (event.key === 'ArrowRight') {
                nextSlide();
            }
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
            <button className="prev" onClick={prevSlide}>&#10094;</button>
            <button className="next" onClick={nextSlide}>&#10095;</button>
        </div>
    );
};

export default PresentationView;
