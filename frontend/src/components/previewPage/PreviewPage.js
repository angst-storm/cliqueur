import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PreviewPage.css';

const PreviewPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [slides, setSlides] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [html, setHtml] = useState(null);

    const slideViewRef = useRef(null);
    const slideRef = useRef(null);
    const [scale, setScale] = useState(1);
    const title = location.state?.title || 'Без названия';


    useEffect(() => {
        if (!location.state?.html) return;
        setHtml(location.state.html);

        const parser = new DOMParser();
        const doc = parser.parseFromString(location.state.html, 'text/html');

        const data = Array.from(doc.querySelectorAll('.slide')).map(el => {
            const style = el.getAttribute('style') || '';
            const wMatch = style.match(/width\s*:\s*(\d+)px/);
            const hMatch = style.match(/height\s*:\s*(\d+)px/);
            return {
                html: el.innerHTML,
                width:  wMatch ? parseInt(wMatch[1], 10) : null,
                height: hMatch ? parseInt(hMatch[1], 10) : null,
            };
        });

        setSlides(data);
    }, [location.state]);

    const handleNavigate = async () => {
        if (html) {
            navigate('/presentation', {state: {html}});
        }
    };

    useEffect(() => {
        function updateScale() {
            if (!slideViewRef.current) return;

            const { clientWidth: viewW, clientHeight: viewH } = slideViewRef.current;
            const { width: slideW, height: slideH } = slides[currentSlide] || {};

            let newScale = 1;
            if (slideW && slideH) {
                newScale = Math.min(viewW / slideW, viewH / slideH);
                newScale = Math.min(1, newScale); // не даём больше 100%
            } else if (slideRef.current) {
                const { scrollWidth, scrollHeight } = slideRef.current;
                newScale = Math.min(viewW / scrollWidth, viewH / scrollHeight);
            }

            setScale(newScale);
        }

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [slides, currentSlide]);

    const slideData = slides[currentSlide] || {};

    return (
        <div className="broadcast-page">
            <header className="header">
                <img src="/logo-big.svg" alt="Logo" className="logo-big" />
                <h1 className="title">{title}</h1>

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
                            width:  slideData.width  ? `${slideData.width}px`  : undefined,
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
