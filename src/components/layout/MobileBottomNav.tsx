import { useNavigate, useLocation } from 'react-router-dom';
import { theme } from 'antd';
import {
  HomeOutlined,
  CalendarOutlined,
  PlusOutlined,
  DollarOutlined,
  MenuOutlined,
} from '@ant-design/icons';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export default function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const navItems = [
    { key: '/', icon: <HomeOutlined style={{ fontSize: 20 }} />, label: 'Home', isNav: true },
    { key: '/calendar', icon: <CalendarOutlined style={{ fontSize: 20 }} />, label: 'Lịch', isNav: true },
    { key: '/schedules/new', icon: <PlusOutlined style={{ fontSize: 24 }} />, label: 'Thêm', isPrimary: true, isNav: true },
    { key: '/payments', icon: <DollarOutlined style={{ fontSize: 20 }} />, label: 'Học phí', isNav: true },
    { key: 'menu', icon: <MenuOutlined style={{ fontSize: 20 }} />, label: 'Menu', isNav: false, onClick: onOpenMenu },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 58,
        background: token.colorBgContainer,
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
      }}
    >
      {navItems.map((item) => {
        const isActive = item.isNav && location.pathname === item.key;
        return (
          <button
            key={item.key}
            onClick={() => {
              if (item.isNav) {
                navigate(item.key);
              } else if (item.onClick) {
                item.onClick();
              }
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              border: 'none',
              background: item.isPrimary ? token.colorPrimary : 'transparent',
              color: item.isPrimary ? '#fff' : isActive ? token.colorPrimary : token.colorTextSecondary,
              cursor: 'pointer',
              padding: item.isPrimary ? '8px 16px' : '6px 12px',
              borderRadius: item.isPrimary ? '50%' : 8,
              width: item.isPrimary ? 46 : 'auto',
              height: item.isPrimary ? 46 : 'auto',
              justifyContent: item.isPrimary ? 'center' : 'flex-start',
              marginBottom: item.isPrimary ? 10 : 0,
              boxShadow: item.isPrimary ? '0 4px 12px rgba(22, 119, 255, 0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {item.icon}
            {!item.isPrimary && <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
