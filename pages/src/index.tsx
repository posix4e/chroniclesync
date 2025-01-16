import React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from './App';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  container
);