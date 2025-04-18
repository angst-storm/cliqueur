import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import PageStart from './components/pageStart/PageStart';
import PresentationPage from './components/presentationPage/PresentationPage';
import PresentationPageId from './components/presentationPage/PresentationPageId';
import './App.css';

function AppWrapper() {
    const location = useLocation();
    const isStartPage = location.pathname === '/';

    return (
        <div
            className={isStartPage ? 'app-wrapper light-bg' : 'app-wrapper dark-bg'}
        >
            <Routes>
                <Route path="/" element={<PageStart />} />
                <Route path="/presentation" element={<PresentationPage />} />
                <Route path="/presentation/:id" element={<PresentationPageId />} />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppWrapper />
        </Router>
    );
}

export default App;
