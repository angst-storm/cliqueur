import React from 'react';
import './SlideControlPanel.css';

const SlideControlPanel = ({
                               onPrev,
                               onNext,
                               onToggleRecording,
                               isRecording,
                               currentSlide
                           }) => {
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

            <button className="control-btn" onClick={() => document.documentElement.requestFullscreen()}>
                <img src="/icons/fullscreen.svg" alt="Полный экран" />
            </button>

            <button
                className={`control-btn mic-btn ${isRecording ? 'active' : ''}`}
                onClick={onToggleRecording}
                title={isRecording ? 'Остановить запись' : 'Начать запись'}
            >
                <img
                    src={isRecording ? "/icons/mic-on.svg" : "/icons/mic.svg"}
                    alt="Микрофон"
                />
            </button>
        </div>
    );
};


export default SlideControlPanel;
