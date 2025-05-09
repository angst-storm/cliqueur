import React, { useEffect } from 'react';
import './ModeSelectorModal.css';

const modes = [
    {
        key: 'mic',
        label: 'По команде “Кликер дальше”',
        description:
            'Микрофон всегда включен при режимах "По ключевым словам" и "По контексту речи" — система слушает выступление для автоматического переключения слайдов. Если выключить микрофон, можно продолжать переключать слайды вручную кнопками.',
        icon: '/icons/mic-on.svg',
    },
    {
        key: 'keywords',
        label: 'По ключевым словам',
        description:
            'Слайды переключаются автоматически при распознавании определённых заранее настроенных ключевых слов в речи. Требуется предварительная настройка списка ключевых слов.',
        icon: '/icons/keywords-on.svg',
    },
    {
        key: 'context',
        label: 'По контексту речи',
        description:
            'AI-Кликер анализирует общий смысл речи докладчика с помощью нейросетей (GigaChat) и сам определяет, когда и на какой слайд перейти.',
        icon: '/icons/context-on.svg',
    },
];

const ModeSelectorModal = ({ selectedModes = [], onSelect, onClose, position }) => {
    // Закрытие при клике вне окна
    useEffect(() => {
        const handleClickOutside = () => onClose();
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [onClose]);


    const toggleMode = (key) => {
        if (selectedModes.includes(key)) {
            onSelect(selectedModes.filter((k) => k !== key));
        } else {
            onSelect([...selectedModes, key]);
        }
    };

    return (
        <div
            className="popover-container"
            style={{
                position: 'absolute',
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                zIndex: 1000,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="mode-modal">
                <h2 className="mode-title">Выбор режима переключения слайдов</h2>
                <div className="mode-container">
                    <div className="mode-list">
                        {modes.map((mode) => (
                            <div key={mode.key} className="mode-row">
                                <img src={mode.icon} alt="" className="mode-icon" />
                                <div
                                    className="mode-checkbox"
                                    onClick={() => toggleMode(mode.key)}
                                    style={{
                                        backgroundImage: `url(${
                                            selectedModes.includes(mode.key)
                                                ? '/icons/checkbox-checked.svg'
                                                : '/icons/checkbox-empty.svg'
                                        })`,
                                    }}
                                />
                                <div className="mode-content">
                                    <div className="mode-label">{mode.label}</div>
                                    <div className="mode-description">{mode.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModeSelectorModal;
