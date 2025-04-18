import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PresentationView from '../../components/presentation/PresentationView';
import RecordingStatusBar from '../statusBar/RecordingStatusBar';

const PresentationPage = () => {
    const location = useLocation();
    const [slides, setSlides] = useState([]);

    useEffect(() => {
        if (location.state?.html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(location.state.html, 'text/html');
            const slides = Array.from(doc.querySelectorAll('.slide'));
            console.log('Слайды:', slides);
            setSlides(slides);
        }
    }, [location.state]);

    return (
        <div>
            {slides.length > 0 && <PresentationView slides={slides} />}
        </div>
    );
};

export default PresentationPage;