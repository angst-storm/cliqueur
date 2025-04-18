import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PresentationView from '../../components/presentation/PresentationView';
import RecordingStatusBar from '../statusBar/RecordingStatusBar';

const PresentationPageId = () => {
    const { id } = useParams();
    const [slides, setSlides] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPresentation = async () => {
            try {
                const s3Endpoint = process.env.REACT_APP_S3_ENDPOINT_URL || 'http://localhost:9000';
                const bucketName = process.env.REACT_APP_S3_BUCKET_NAME || 'presentations';
                const response = await fetch(`${s3Endpoint}/${bucketName}/${id}/index.html`);
                if (!response.ok) {
                    throw new Error('Failed to fetch presentation');
                }
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const slides = Array.from(doc.querySelectorAll('.slide'));
                setSlides(slides);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching presentation:', err);
            }
        };

        if (id) {
            fetchPresentation();
        }
    }, [id]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            {slides.length > 0 && <PresentationView slides={slides} />}
        </div>
    );
};

export default PresentationPageId;