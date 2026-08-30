import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Badge, Avatar, Dropdown, Button, theme } from 'antd';
import {
  HomeOutlined, CalendarOutlined, ScheduleOutlined, BookOutlined,
  EnvironmentOutlined, CheckSquareOutlined, DollarOutlined,
  BarChartOutlined, BellOutlined, SettingOutlined, LogoutOutlined, UserOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useSocket } from '../../hooks/useSocket';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import MobileBottomNav from './MobileBottomNav';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: 'Dashboard' },
  { key: '/calendar', icon: <CalendarOutlined />, label: 'Lịch học' },
  { key: '/schedules', icon: <ScheduleOutlined />, label: 'Lịch của tôi' },
  { key: '/subjects', icon: <BookOutlined />, label: 'Môn học' },
  { key: '/locations', icon: <EnvironmentOutlined />, label: 'Địa điểm' },
  { key: '/attendance', icon: <CheckSquareOutlined />, label: 'Điểm danh' },
  { key: '/payments', icon: <DollarOutlined />, label: 'Học phí' },
  { key: '/statistics', icon: <BarChartOutlined />, label: 'Thống kê' },
  { key: '/notifications', icon: <BellOutlined />, label: 'Thông báo' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Cài đặt' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Register global socket listeners
  useSocket();

  const { token } = theme.useToken();

  const userMenu = [
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ', onClick: () => navigate('/settings') },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: clearAuth },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar – desktop only */}
      {!isMobile && (
        <Sider
          breakpoint="lg"
          collapsedWidth="80"
          style={{ background: token.colorBgContainer, borderRight: `1px solid ${token.colorBorderSecondary}` }}
        >
          {/* Logo */}
          <div style={{ padding: '16px', textAlign: 'center', fontWeight: 700, fontSize: 16, color: token.colorPrimary }}>
            📚 Study Tracker
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ border: 'none' }}
          />
        </Sider>
      )}

      <Layout>
        {/* Top Header */}
        <Header style={{
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          {isMobile && (
            <span style={{ fontWeight: 700, color: token.colorPrimary }}>📚 Study Tracker</span>
          )}
          {!isMobile && <div />}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/schedules/new')}
              size={isMobile ? 'small' : 'middle'}
            >
              {!isMobile && 'Thêm lịch'}
            </Button>

            <Badge count={unreadCount} size="small">
              <Button
                icon={<BellOutlined />}
                shape="circle"
                onClick={() => navigate('/notifications')}
              />
            </Badge>

            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <Avatar
                src={user?.avatar}
                icon={<UserOutlined />}
                style={{ cursor: 'pointer', background: token.colorPrimary }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </Avatar>
            </Dropdown>
          </div>
        </Header>

        {/* Main Content */}
        <Content style={{
          margin: isMobile ? '0 0 56px' : '16px',
          padding: isMobile ? '12px' : '24px',
          background: isMobile ? 'transparent' : token.colorBgContainer,
          borderRadius: isMobile ? 0 : token.borderRadius,
          overflow: 'auto',
        }}>
          <Outlet />
        </Content>

        {/* Bottom Navigation – mobile only */}
        {isMobile && <MobileBottomNav />}
      </Layout>
    </Layout>
  );
}
