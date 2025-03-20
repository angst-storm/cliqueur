import { useState, useRef, useCallback } from 'react';

export const AudioRecorder = (sendChunk) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef(null);
    const CHUNK_INTERVAL = 5000; // пока 5 сек, дальше будем уменьшать

    const initAudio = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const options = { mimeType: 'audio/webm; codecs=opus' };

            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.warn('Тип', options.mimeType, 'не поддерживается');
                delete options.mimeType;
            }

            mediaRecorder.current = new MediaRecorder(stream, options);

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0 && sendChunk) {
                    sendChunk(event.data);
                }
            };

            mediaRecorder.current.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                mediaRecorder.current = null;
            };

        } catch (error) {
            console.error('Ошибка доступа к микрофону:', error);
            throw error;
        }
    }, [sendChunk]);

    const startRecording = useCallback(async () => {
        if (!mediaRecorder.current) {
            await initAudio();
        }
        mediaRecorder.current.start(CHUNK_INTERVAL);
        setIsRecording(true);
    }, [initAudio]);

    const stopRecording = useCallback(() => {
        mediaRecorder.current?.state === 'recording' && mediaRecorder.current.stop();
        setIsRecording(false);
    }, []);

    const toggleRecording = useCallback(async () => {
        isRecording ? stopRecording() : await startRecording();
    }, [isRecording, startRecording, stopRecording]);

    return { isRecording, toggleRecording, stopRecording };
};