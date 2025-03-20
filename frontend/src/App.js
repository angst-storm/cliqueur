import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slides, setSlides] = useState([]);

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

    useEffect(() => {
        fetch('/Sample.html')
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const slideElements = Array.from(doc.querySelectorAll('.slide'));
                setSlides(slideElements);
            })
            .catch(error => console.error('Ошибка загрузки слайдов:', error));
    }, []);

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
}

export default App;