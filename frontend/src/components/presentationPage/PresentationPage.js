import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import PresentationView from '../../components/presentation/PresentationView';
import { fetchPresentationHtml, parseSlidesAsDomElements } from '../../services/s3Loader';

const PresentationPage = () => {
    const { id } = useParams();
    const [slides, setSlides] = useState([]);
    const [error, setError] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const el = containerRef.current || document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();

        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen?.();
            }
        };
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const html = await fetchPresentationHtml(id);
                const domSlides = parseSlidesAsDomElements(html);
                setSlides(domSlides);
            } catch (err) {
                setError(err.message);
                console.error('Error loading presentation:', err);
            }
        };

        if (id) {
            load();
        }
    }, [id]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div ref={containerRef}>
            {slides.length > 0 && <PresentationView id={id} slides={slides} />}
        </div>
    );
};

export default PresentationPage;
