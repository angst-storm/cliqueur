import React from 'react';
import './CopyLink.css';

const CopyLink = ({ link }) => {
    return (
        <div className="link-container">
            <div className="link-label">Доступ к презентации по ссылке:</div>
            <input
                className="link-input"
                value={link}
                readOnly
                onClick={() => {
                    navigator.clipboard.writeText(link);
                }}
            />
        </div>

    );
};

export default CopyLink;
