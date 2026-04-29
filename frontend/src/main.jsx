import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 获取 HTML 中的根元素
const rootElement = document.getElementById('root');

// 创建 React 根节点并渲染 App 组件
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
