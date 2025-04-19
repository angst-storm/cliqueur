import React, { useEffect, useState } from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import './BroadcastPage.css';

const BroadcastPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [slides, setSlides] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [html, setHtml] = useState(null);

    useEffect(() => {
        if (location.state?.html) {
            setHtml(location.state.html);
            const parser = new DOMParser();
            const doc = parser.parseFromString(location.state.html, 'text/html');
            const slides = Array.from(doc.querySelectorAll('.slide'));
            console.log('Слайды:', slides);
            setSlides(slides);
        }
    }, [location.state]);

    const handleNavigate = () => {
        if (html) {
            navigate('/presentation', { state: { html } });
        }
    };

    return (
        <div className="broadcast-page">
            <header className="header">
                <h1 className="title">Название презентации</h1>
                <button
                    className="start-button"
                    onClick={handleNavigate}
                >
                    Начать выступление</button>
            </header>

            <div className="content">
                <aside className="sidebar">
                    {slides.map((slide, index) => (
                        <div
                            key={index}
                            className={`thumbnail ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(index)}
                            dangerouslySetInnerHTML={{ __html: slide.innerHTML }}
                        />
                    ))}
                </aside>

                <main className="slide-view">
                    <div className="slide"
                         dangerouslySetInnerHTML={{ __html: slides[currentSlide]?.innerHTML || '' }} />
                </main>
            </div>
        </div>
    );
};

export default BroadcastPage;
