import React, { useCallback, useRef } from 'react';
import { useWSClient } from '../../hooks/useWSClient';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import './RecordingStatusBar.css';

const RecordingStatusBar = () => {
    const { connect, disconnect } = useWSClient();
    const { isRecording, startRecording, stopRecording } = useAudioRecorder();
    const wsClient = useRef(null);

    const handleRecordToggle = useCallback(async () => {
        if (!isRecording) {
            try {
                wsClient.current = await connect('asr');

                await startRecording((data) => {
                    if (wsClient.current?.isConnected) {
                        wsClient.current.send(data);
                    }
                });

            } catch (error) {
                console.error('Ошибка запуска записи:', error);
                stopRecording();
                disconnect('asr');
            }
        } else {
            stopRecording();
            disconnect('asr');
            wsClient.current?.close();
            wsClient.current = null;
        }
    }, [isRecording, startRecording, stopRecording, connect, disconnect]);

    return (
        <div className="status-bar">
            <button
                onClick={handleRecordToggle}
                className={`record-button ${isRecording ? 'active' : ''}`}
            >
                {isRecording ? '⏹ Stop' : '⏺ Record'}
            </button>
        </div>
    );
};

export default RecordingStatusBar;