import React from 'react';
import { createRoot } from 'react-dom/client';
// Базовые стили идут первыми намеренно. Vite собирает CSS в порядке
// импортов, а у общих и компонентных правил одинаковый вес: при обратном
// порядке общее правило перебивало частное, и заголовок секции вылезал
// из своей колонки.
import './styles/global.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
