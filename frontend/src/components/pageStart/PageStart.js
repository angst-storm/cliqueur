import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWSClient } from '../../hooks/useWSClient';
import './PageStart.css';
import { useNavigate } from 'react-router-dom';
import CopyLink from "./CopyLink";
import { ClipLoader } from 'react-spinners';

const PageStart = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { connect, disconnect, isConnected, isConnecting, getClient } = useWSClient();
    const clientRef = useRef(null);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [presentationLink, setPresentationLink] = useState('');

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
        setUploadedFileName(file.name);
        setPresentationLink('');

        try {
            const fileBuffer = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });

            await clientRef.current.send(fileBuffer);

            let receivedLink = null;

            const onMessage = (event) => {
                const data = event.data;

                if (data.startsWith('http')) {
                    receivedLink = data;
                    setPresentationLink(data);
                    setIsLoading(false);
                    clientRef.current.socket.removeEventListener('message', onMessage);
                }

            };

            clientRef.current.socket.addEventListener('message', onMessage);
        } catch (err) {
            setError(err.message || 'Ошибка загрузки');
            setIsLoading(false);
        }
    }, []);


    const handleNavigate = () => {
        const id = extractIdFromLink(presentationLink);
        if (id) {
            navigate(`/preview/${id}`);
        } else {
            alert('Не удалось извлечь ID презентации из ссылки');
        }
    };

    const extractIdFromLink = (url) => {
        try {
            const match = url.match(/\/presentation\/([^/?#]+)/);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    };


    return (
        <div className="page-start-container">
            <div className="page-title">
                Загрузка презентации
            </div>
            <div className="upload-box">
                <label
                    className={`upload-area ${uploadedFileName ? 'disabled' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        if (uploadedFileName) return;
                        const file = e.dataTransfer.files[0];
                        if (file) handleFileUpload({ target: { files: [file] } });
                    }}
                >
                    <img src="/icons/upload.svg" alt="upload" className="icon" />
                    <div className="info" style={{ fontSize: '18px', marginTop: '4px', color: '#474747'}}>.pptx</div>
                    <div className="info">Перетащите файл сюда или нажмите, чтобы загрузить</div>
                    <div className="info" style={{ fontSize: '16px', marginTop: '8px' }}>
                        Максимальный размер файла: <span style={{ color: '#474747'}}>100 MB</span>
                    </div>
                    <input type="file" accept=".pptx" onChange={handleFileUpload} disabled={uploadedFileName} />
                </label>

                <div className="file-loading-container">
                    {!isConnected('presentation') && (
                        <div className="error-message">
                            {isConnecting ? 'Подключение...' : 'Сервер недоступен'}
                        </div>
                    )}
                    {isLoading ? (
                        <div className="file-loading">
                            <div className="file-name">{uploadedFileName || 'Загрузка файла...'}</div>
                            <ClipLoader size={40} color="#868080" />
                        </div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : uploadedFileName && presentationLink? (
                        <div className="file-name">
                            {uploadedFileName} получен!
                        </div>
                    ) : null}
                </div>

                <CopyLink link={presentationLink || '...'} />

                <button
                    className={`upload-submit ${isLoading || !uploadedFileName || !presentationLink ? 'disabled' : ''}`}
                    disabled={isLoading || !uploadedFileName || !presentationLink}
                    onClick={handleNavigate}
                >
                    Загрузить
                </button>
            </div>
        </div>
    );
};

export default PageStart;
