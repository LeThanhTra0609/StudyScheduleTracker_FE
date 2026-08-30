import { useNavigate, useLocation } from 'react-router-dom';
import { theme } from 'antd';
import {
  HomeOutlined, CalendarOutlined, PlusOutlined, DollarOutlined, SettingOutlined,
} from '@ant-design/icons';

const navItems = [
  { key: '/', icon: <HomeOutlined style={{ fontSize: 20 }} />, label: 'Home' },
  { key: '/calendar', icon: <CalendarOutlined style={{ fontSize: 20 }} />, label: 'Lịch' },
  { key: '/schedules/new', icon: <PlusOutlined style={{ fontSize: 24 }} />, label: 'Thêm', isPrimary: true },
  { key: '/payments', icon: <DollarOutlined style={{ fontSize: 20 }} />, label: 'Học phí' },
  { key: '/settings', icon: <SettingOutlined style={{ fontSize: 20 }} />, label: 'Cài đặt' },
];

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 56,
      background: token.colorBgContainer,
      borderTop: `1px solid ${token.colorBorderSecondary}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 1000,
    }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.key;
        return (
          <button
            key={item.key}
            onClick={() => navigate(item.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              border: 'none',
              background: item.isPrimary ? token.colorPrimary : 'transparent',
              color: item.isPrimary ? '#fff' : isActive ? token.colorPrimary : token.colorTextSecondary,
              cursor: 'pointer',
              padding: item.isPrimary ? '8px 16px' : '4px 12px',
              borderRadius: item.isPrimary ? '50%' : 4,
              width: item.isPrimary ? 48 : 'auto',
              height: item.isPrimary ? 48 : 'auto',
              justifyContent: item.isPrimary ? 'center' : 'flex-start',
              marginBottom: item.isPrimary ? 8 : 0,
            }}
          >
            {item.icon}
            {!item.isPrimary && <span style={{ fontSize: 10 }}>{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
