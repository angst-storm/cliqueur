import { useCallback, useRef, useState } from 'react';

export const useAudioRecorder = () => {
    const mediaRecorder = useRef(null);
    const streamRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);

    const initAudio = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { channelCount: 1 }
            });
            streamRef.current = stream;
            return stream;
        } catch (error) {
            console.error('Ошибка доступа к микрофону:', error);
            throw error;
        }
    }, []);

    const startRecording = useCallback(async (sendChunk) => {
        try {
            const stream = await initAudio();
            mediaRecorder.current = new MediaRecorder(stream, {
                mimeType: 'audio/webm',
                audioBitsPerSecond: 64000
            });

            mediaRecorder.current.ondataavailable = (e) => {
                console.log(`[Audio] Получен чанк, размер: ${e.data.size} байт`);
                if (e.data.size > 0) {
                    sendChunk(e.data);
                } else {
                    console.warn('[Audio] Пустой фрагмент данных');
                }
            };

            mediaRecorder.current.start(2000);
            setIsRecording(true);
            console.log('[Audio] Запись начата');
        } catch (error) {
            console.error('Ошибка при начале записи:', error);
        }
    }, [initAudio]);

    const stopRecording = useCallback(() => {
        if (mediaRecorder.current) {
            mediaRecorder.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsRecording(false);
        console.log('[Audio] Запись остановлена');
    }, []);

    return { isRecording, startRecording, stopRecording };
};
