import React, {useState, useCallback, useEffect, useRef} from 'react';
import { useWSClient } from '../../hooks/useWSClient';
import './PageStart.css';
import { useNavigate } from 'react-router-dom';

const PageStart = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { connect, disconnect, isConnected, isConnecting, getClient } = useWSClient();
    const clientRef = useRef(null);

    useEffect(() => {
        const initConnection = async () => {
            if (clientRef.current) return;

            try {
                clientRef.current = await connect('presentation');
            } catch (error) {
                console.log('Ошибка подключения к серверу');
            }
        };

        initConnection();

        return () => {
            if (clientRef.current) {
                disconnect('presentation');
                clientRef.current = null;
            }
        };
    }, [connect, disconnect]);


    const handleFileUpload = useCallback(async (event) => {
        const file = event.target.files[0];
        if (!file || !clientRef.current) return;

        setIsLoading(true);
        setError('');

        try {
            const fileBuffer = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });

            await clientRef.current.send(fileBuffer);

            const html = await new Promise((resolve) => {
                clientRef.current.socket.addEventListener('message', (event) => {
                    resolve(event.data);
                }, { once: true });
            });

            navigate('/presentation', { state: { html } });
        } catch (err) {
            setError(err.message || 'Ошибка загрузки');
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    return (
        <div className="page-start-container">
            <div className="upload-box">
                <h1>Upload Presentation</h1>
                <label className="upload-button">
                    {isLoading ? 'Загрузка...' : 'Выберите файл PPTX'}
                    <input
                        type="file"
                        accept=".pptx"
                        onChange={handleFileUpload}
                        disabled={!isConnected('presentation') || isLoading}
                        hidden
                    />
                </label>

                {!isConnected('presentation') && (
                    <div className="error-message">
                        {isConnecting ? 'Подключение...' : 'Сервер недоступен'}
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}
            </div>
        </div>
    );
};

export default PageStart;