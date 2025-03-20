import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { WSClient } from './services/websocket/WSClient';
import PresentationView from './components/presentation/PresentationView';
import { AudioRecorder } from './hooks/AudioRecorder';

function App() {
    const [slides, setSlides] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const wsClient = useRef(null);

    const sendAudioChunk = useCallback((data) => {
        if (wsClient.current?.isConnected) {
            wsClient.current.send(data);
        }
    }, []);

    const { isRecording, toggleRecording, stopRecording } = AudioRecorder(sendAudioChunk);

    useEffect(() => {
        wsClient.current = new WSClient('ws://localhost:8000/ws');
        wsClient.current.connect()
            .then(() => setIsConnected(true))
            .catch(console.error);

        return () => {
            wsClient.current?.close();
            stopRecording();
        };
    }, [stopRecording]);

    useEffect(() => {
        fetch('/Sample.html') // загрузка слайдов
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                setSlides(Array.from(doc.querySelectorAll('.slide')));
            })
            .catch(console.error);
    }, []);

    return (
        <div>
            <div className="status-bar">
                <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? 'Online' : 'Offline'}
                </div>

                <button
                    onClick={toggleRecording}
                    className={`record-button ${isRecording ? 'active' : ''}`}
                    disabled={!isConnected}
                >
                    {isRecording ? '⏹ Stop' : '⏺ Record'}
                </button>
            </div>

            {slides.length > 0 && <PresentationView slides={slides} />}
        </div>
    );
}

export default App;