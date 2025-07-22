// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ReactGA from 'react-ga4';

// Initialize GA4 with your Measurement ID
ReactGA.initialize('G-M3G7140XC6');

// Optionally, send a pageview event
ReactGA.send({ hitType: 'pageview', page: window.location.pathname + window.location.search });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();