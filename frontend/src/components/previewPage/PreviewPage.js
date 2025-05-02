import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { fetchPresentationHtml, parseSlidesFromHtml } from '../../services/s3Loader';

import './PreviewPage.css';

const PreviewPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [slides, setSlides] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [scale, setScale] = useState(1);

    const slideViewRef = useRef(null);
    const slideRef = useRef(null);

    const { prepareMicrophoneAccess } = useAudioRecorder();

    useEffect(() => {
        const loadSlides = async () => {
            try {
                const html = await fetchPresentationHtml(id);
                const parsed = parseSlidesFromHtml(html);
                setSlides(parsed);
            } catch (error) {
                console.error('Ошибка загрузки презентации:', error);
            }
        };

        if (id) {
            loadSlides();
        }
    }, [id]);


    const handleNavigate = async () => {
        try {
            await prepareMicrophoneAccess();
            navigate(`/presentation/${id}`);
        } catch {
            alert('Пожалуйста, разрешите доступ к микрофону для начала выступления.');
        }
    };

    useEffect(() => {
        const updateScale = () => {
            if (!slideViewRef.current) return;

            const { clientWidth, clientHeight } = slideViewRef.current;
            const { width, height } = slides[currentSlide] || {};

            let newScale = 1;
            if (width && height) {
                newScale = Math.min(clientWidth / width, clientHeight / height);
                newScale = Math.min(1, newScale);
            } else if (slideRef.current) {
                newScale = Math.min(clientWidth / slideRef.current.scrollWidth, clientHeight / slideRef.current.scrollHeight);
            }

            setScale(newScale);
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [slides, currentSlide]);

    const slideData = slides[currentSlide] || {};

    return (
        <div className="broadcast-page">
            <header className="header">
                <img src="/logo-big.svg" alt="Logo" className="logo-big" />
                <h1 className="title">{id}</h1>

                <div className="buttons-container">
                    <button className="new-presentation-button" onClick={() => navigate('/')}>
                        + Новая презентация
                    </button>

                    <button className="start-button" onClick={handleNavigate}>
                        Начать выступление
                    </button>
                </div>
            </header>

            <div className="content">
                <aside className="sidebar">
                    {slides.map((s, i) => (
                        <div
                            key={i}
                            className={`slide-item ${i === currentSlide ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(i)}
                        >
                            <span className="slide-mini-number">{i + 1}</span>
                            <div
                                className={`thumbnail ${i === currentSlide ? 'active' : ''}`}
                                dangerouslySetInnerHTML={{ __html: s.html }}
                            />
                        </div>
                    ))}
                </aside>

                <main className="slide-view" ref={slideViewRef}>
                    <div
                        className="slide-wrapper"
                        style={{
                            width: slideData.width ? `${slideData.width}px` : undefined,
                            height: slideData.height ? `${slideData.height}px` : undefined,
                            transform: `scale(${scale})`,
                            transformOrigin: 'center center',
                        }}
                    >
                        <div
                            ref={slideRef}
                            className="slide"
                            dangerouslySetInnerHTML={{ __html: slideData.html }}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PreviewPage;
