import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import App from './App';
import './index.css';

dayjs.locale('vi');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        locale={viVN}
        theme={{
          token: {
            colorPrimary: '#2e5239',
            colorInfo: '#2e5239',
            colorSuccess: '#4a7c59',
            colorWarning: '#d48806',
            colorBgLayout: '#f3eee3',
            colorBgContainer: '#ffffff',
            colorBorder: '#e6ded0',
            colorBorderSecondary: '#eee6d8',
            colorText: '#243527',
            colorTextSecondary: '#6e7f72',
            borderRadius: 14,
            borderRadiusLG: 20,
            borderRadiusSM: 8,
            fontFamily: "'Quicksand', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          },
          components: {
            Button: {
              borderRadius: 20,
              fontWeight: 600,
            },
            Card: {
              borderRadiusLG: 20,
            },
            Tag: {
              borderRadiusSM: 8,
            },
          },
        }}
      >
        <AntApp>
          <App />
        </AntApp>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
