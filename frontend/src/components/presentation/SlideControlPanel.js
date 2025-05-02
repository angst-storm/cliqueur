import React from 'react';
import './SlideControlPanel.css';
import { useLocation, useNavigate } from 'react-router-dom';


const SlideControlPanel = ({
                               onPrev,
                               onNext,
                               onToggleRecording,
                               isRecording,
                               currentSlide,
                               isKeywordMode,
                               isContextMode,
                               onToggleKeywordMode,
                               onToggleContextMode,
                               id
                           }) => {
    const navigate = useNavigate();

    return (
        <div className="slide-control-panel">
            <button className="control-btn" onClick={onPrev} title="Назад">
                <img src="/icons/prev.svg" alt="Назад" />
            </button>

            <div className="control-btn slide-number-display" title={`Слайд ${currentSlide + 1}`}>
                <img src="/icons/slide-number.svg" alt="Номер слайда" />
                <span className="slide-number">{currentSlide + 1}</span>
            </div>

            <button className="control-btn" onClick={onNext} title="Вперёд">
                <img src="/icons/next.svg" alt="Вперёд" />
            </button>

            <button className="control-btn" onClick={async () => {
                if (isRecording) {
                    await onToggleRecording();
                }
                navigate(`/preview/${id}`);
            } }>
                <img src="/icons/fullscreen.svg" alt="Полный экран" />
            </button>

            <button
                className={`control-btn mic-btn ${isRecording ? 'active' : ''}`}
                onClick={onToggleRecording}
                title="Переключение слайда голосовой командой «Кликер, дальше!»"
            >
                <img
                    src={isRecording ? "/icons/mic-on.svg" : "/icons/mic-off.svg"}
                    alt="Передача звука"
                />
            </button>

            <button
                className={`control-btn keyword-btn ${isKeywordMode ? 'active' : ''}`}
                onClick={onToggleKeywordMode}
                title="Переключение при обнаружении заранее заданных ключевых слов"
            >
                <img
                    src={isKeywordMode ? "/icons/keywords-on.svg" : "/icons/keywords-off.svg"}
                    alt="Ключевые слова"
                />
            </button>

            <button
                className={`control-btn context-btn ${isContextMode ? 'active' : ''}`}
                onClick={onToggleContextMode}
                title="Автоматическое переключение по смыслу сказанного"
            >
                <img
                    src={isContextMode ? "/icons/context-on.svg" : "/icons/context-off.svg"}
                    alt="Контекст"
                />
            </button>
        </div>
    );
};


export default SlideControlPanel;
