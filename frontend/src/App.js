import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PageStart from './components/pageStart/PageStart';
import PresentationPage from './components/presentationPage/PresentationPage';
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<PageStart />} />
                <Route path="/presentation" element={<PresentationPage />} />
            </Routes>
        </Router>
    );
}

export default App;