import { useNavigate, useLocation } from 'react-router-dom';
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

  const navItems = [
    { key: '/', icon: <HomeOutlined style={{ fontSize: 20 }} />, label: 'Home', isNav: true },
    { key: '/calendar', icon: <CalendarOutlined style={{ fontSize: 20 }} />, label: 'Lịch', isNav: true },
    { key: '/schedules/new', icon: <PlusOutlined style={{ fontSize: 22 }} />, label: 'Thêm', isPrimary: true, isNav: true },
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
        height: 64,
        background: '#fcfbf8',
        borderTop: '1px solid #e8dfd1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000,
        boxShadow: '0 -4px 16px rgba(40, 60, 44, 0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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
              background: item.isPrimary
                ? 'linear-gradient(135deg, #2e5239 0%, #44714f 100%)'
                : 'transparent',
              color: item.isPrimary ? '#ffffff' : isActive ? '#2e5239' : '#6e7f72',
              cursor: 'pointer',
              padding: item.isPrimary ? '8px' : '6px 12px',
              borderRadius: item.isPrimary ? '50%' : 12,
              width: item.isPrimary ? 46 : 'auto',
              height: item.isPrimary ? 46 : 'auto',
              justifyContent: 'center',
              marginBottom: item.isPrimary ? 14 : 0,
              boxShadow: item.isPrimary ? '0 4px 12px rgba(46, 82, 57, 0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {item.icon}
            {!item.isPrimary && (
              <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500 }}>
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
