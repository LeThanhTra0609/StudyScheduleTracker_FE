import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Badge,
  Avatar,
  Dropdown,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  App,
  Tooltip,
  Drawer,
  Divider,
} from 'antd';
import {
  HomeOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  BookOutlined,
  EnvironmentOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  BarChartOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  PlusOutlined,
  DownOutlined,
  CopyOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useSocket } from '../../hooks/useSocket';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { userApi } from '../../api/user.api';
import MobileBottomNav from './MobileBottomNav';
import NotificationPermissionModal from '../notification/NotificationPermissionModal';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', label: 'Dashboard' },
  { key: '/calendar', label: 'Lịch học' },
  { key: '/schedules', label: 'Lịch của tôi' },
  { key: '/subjects', label: 'Môn học' },
  { key: '/locations', label: 'Địa điểm' },
  { key: '/attendance', label: 'Điểm danh' },
  { key: '/payments', label: 'Học phí' },
  { key: '/statistics', label: 'Thống kê' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth, selectedChildId, setSelectedChildId, updateUser } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { message } = App.useApp();

  // State: mobile drawer & modal link child
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkForm] = Form.useForm();

  // Register global socket listeners
  useSocket();

  const userMenu = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '6px 4px' }}>
          <div style={{ fontWeight: 700, color: '#243527', fontSize: 14 }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: '#6e7f72' }}>{user?.email}</div>
          <Tag color={user?.role === 'PARENT' ? 'gold' : 'green'} style={{ marginTop: 6, borderRadius: 6 }}>
            {user?.role === 'PARENT' ? '👨‍👩‍👧 Phụ huynh' : '🎓 Học sinh'}
          </Tag>
        </div>
      ),
    },
    { type: 'divider' as const },
    {
      key: 'notifications',
      icon: <BellOutlined style={{ color: '#2e5239' }} />,
      label: (
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>Thông báo</span>
          {unreadCount > 0 && <Badge count={unreadCount} size="small" />}
        </Space>
      ),
      onClick: () => navigate('/notifications'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined style={{ color: '#2e5239' }} />,
      label: 'Cài đặt & Hồ sơ',
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: clearAuth },
  ];

  const navMenuItems = menuItems;

  // Parent: current selected child
  const childrenList = user?.children || [];
  const selectedChild = childrenList.find((c) => c._id === selectedChildId) || childrenList[0];

  const childDropdownItems = [
    ...childrenList.map((c) => ({
      key: c._id,
      label: (
        <Space style={{ width: '100%', justifyContent: 'space-between', padding: '4px 0' }}>
          <Space>
            <Avatar size="small" style={{ backgroundColor: c._id === selectedChild?._id ? '#4a7c59' : '#8d5b32' }}>
              {c.name?.[0]?.toUpperCase() || 'C'}
            </Avatar>
            <span style={{ fontWeight: c._id === selectedChild?._id ? 700 : 500 }}>{c.name}</span>
          </Space>
          {c._id === selectedChild?._id && <Tag color="green" style={{ margin: 0, borderRadius: 6 }}>Đang chọn</Tag>}
        </Space>
      ),
      onClick: () => {
        if (c._id !== selectedChildId) {
          setSelectedChildId(c._id);
        }
      },
    })),
    { type: 'divider' as const },
    {
      key: 'link-new-child',
      icon: <PlusOutlined />,
      label: 'Kết nối thêm con',
      onClick: () => {
        linkForm.resetFields();
        setIsLinkModalOpen(true);
      },
    },
  ];

  // Handle linking child
  const handleLinkChild = async (values: { linkCode: string }) => {
    setLinkLoading(true);
    try {
      const res = await userApi.linkChild(values.linkCode);
      message.success(res.data.message || 'Kết nối thành công!');
      setIsLinkModalOpen(false);

      const profileRes = await userApi.getProfile();
      updateUser(profileRes.data.user);
      if (res.data.children && res.data.children.length > 0) {
        const lastChild = res.data.children[res.data.children.length - 1];
        setSelectedChildId(lastChild._id);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể kết nối với học sinh');
    } finally {
      setLinkLoading(false);
    }
  };

  // Copy link code for student
  const handleCopyLinkCode = () => {
    if (user?.linkCode) {
      navigator.clipboard.writeText(user.linkCode);
      message.success(`Đã sao chép mã kết nối: ${user.linkCode}`);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f3eee3' }} hasSider>
      {/* Sidebar – Desktop only */}
      {!isMobile && (
        <Sider
          width={240}
          style={{
            background: '#23412c',
            borderRight: '1px solid #1c3523',
            height: '100vh',
            position: 'sticky',
            top: 0,
            left: 0,
            zIndex: 100,
            boxShadow: '4px 0 16px rgba(25, 45, 30, 0.08)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Wooden Plaque Logo */}
            <div style={{ padding: '20px 14px 14px', textAlign: 'center' }}>
              <div
                className="wooden-plaque"
                onClick={() => navigate('/')}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                }}
              >
                <span style={{ fontSize: 18 }}>🍃</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, opacity: 0.9, fontWeight: 700, textTransform: 'uppercase' }}>
                    STUDY ISLAND
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.5, lineHeight: 1.1 }}>
                    Study Tracker
                  </div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              <Menu
                className="cozy-sidebar-menu"
                mode="inline"
                selectedKeys={[location.pathname]}
                items={navMenuItems}
                onClick={({ key }) => navigate(key)}
              />
            </div>

            {/* Daily Study Tip Widget at bottom */}
            <div style={{ padding: '14px', marginTop: 'auto' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 16,
                  padding: '12px 14px',
                  color: '#d1e5d7',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontWeight: 700, fontSize: 12, color: '#e8f5ec' }}>
                  <span>🌱</span>
                  <span>Mẹo học tập hôm nay</span>
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.9 }}>
                  Nghỉ 5 phút sau mỗi 25 phút học (Pomodoro) giúp bộ não ghi nhớ sâu hơn 40%!
                </div>
              </div>
            </div>
          </div>
        </Sider>
      )}

      <Layout style={{ background: '#f3eee3', minWidth: 0 }}>
        {/* Top Header */}
        <Header
          style={{
            background: '#fcfbf8',
            borderBottom: '1px solid #e8dfd1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 12px' : '0 24px',
            height: 64,
            lineHeight: 'normal',
            gap: 12,
            position: 'sticky',
            top: 0,
            zIndex: 99,
            boxShadow: '0 2px 8px rgba(44, 62, 46, 0.03)',
          }}
        >
          {/* Left: Mobile hamburger & Student / Child indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: 18, color: '#2e5239' }} />}
                onClick={() => setMobileDrawerOpen(true)}
                style={{ padding: '4px 8px' }}
              />
            )}

            {/* Student role & Link Code */}
            {user?.role === 'STUDENT' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 800, fontSize: isMobile ? 13 : 15, color: '#243527', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🎓</span>
                  <span>{user.name}</span>
                </span>
                {user.linkCode && (
                  <Tooltip title="Bấm để sao chép mã kết nối cho phụ huynh">
                    <Button
                      size="small"
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={handleCopyLinkCode}
                      style={{
                        background: '#eaf3ec',
                        border: '1px dashed #b7d6be',
                        color: '#2e5239',
                        borderRadius: 14,
                        fontSize: 12,
                        padding: '0 10px',
                        fontWeight: 700,
                        height: 28,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      Mã: {user.linkCode}
                    </Button>
                  </Tooltip>
                )}
              </div>
            )}

            {/* PARENT: Multi-Child Selector */}
            {user?.role === 'PARENT' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {childrenList.length > 0 ? (
                  <Dropdown menu={{ items: childDropdownItems }} trigger={['click']}>
                    <Button
                      size="middle"
                      style={{
                        borderRadius: 20,
                        background: '#f4eee3',
                        border: '1px solid #dfd4c2',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        maxWidth: isMobile ? 160 : 260,
                        padding: '4px 14px',
                        color: '#243527',
                        fontWeight: 700,
                        height: 34,
                      }}
                    >
                      <span>👶</span>
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: isMobile ? 12 : 13,
                        }}
                      >
                        Đang theo dõi: {selectedChild ? selectedChild.name : 'Chọn con'}
                      </span>
                      <DownOutlined style={{ fontSize: 10, color: '#6e7f72', flexShrink: 0 }} />
                    </Button>
                  </Dropdown>
                ) : (
                  <Button
                    size="middle"
                    type="dashed"
                    icon={<PlusOutlined />}
                    style={{ borderColor: '#8d5b32', color: '#8d5b32', borderRadius: 20, fontSize: 12, fontWeight: 700 }}
                    onClick={() => {
                      linkForm.resetFields();
                      setIsLinkModalOpen(true);
                    }}
                  >
                    + Kết nối tài khoản con
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Right Header actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
            {!isMobile && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/schedules/new')}
                style={{
                  background: 'linear-gradient(135deg, #2e5239 0%, #44714f 100%)',
                  borderColor: '#2e5239',
                  borderRadius: 20,
                  fontWeight: 700,
                  height: 36,
                  boxShadow: '0 3px 8px rgba(46, 82, 57, 0.25)',
                }}
              >
                Thêm lịch
              </Button>
            )}

            {/* Icon Thông báo */}
            <Tooltip title="Thông báo">
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <Button
                  icon={
                    <BellOutlined
                      style={{
                        color: location.pathname === '/notifications' ? '#ffffff' : '#2e5239',
                        fontSize: 16,
                      }}
                    />
                  }
                  shape="circle"
                  size={isMobile ? 'small' : 'middle'}
                  onClick={() => navigate('/notifications')}
                  style={{
                    background: location.pathname === '/notifications' ? '#2e5239' : '#f4eee3',
                    border: location.pathname === '/notifications' ? '1px solid #2e5239' : '1px solid #dfd4c2',
                    boxShadow: location.pathname === '/notifications' ? '0 2px 6px rgba(46, 82, 57, 0.3)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                />
              </Badge>
            </Tooltip>

            {/* Icon Avatar */}
            <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow trigger={['click']}>
              <Tooltip title={user?.name ? `${user.name} • Hồ sơ & Cài đặt` : 'Hồ sơ & Cài đặt'}>
                <div style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <Avatar
                    src={user?.avatar}
                    size={isMobile ? 32 : 36}
                    icon={<UserOutlined />}
                    style={{
                      cursor: 'pointer',
                      background: user?.role === 'PARENT' ? '#8d5b32' : '#2e5239',
                      border: location.pathname === '/settings' ? '2px solid #2e5239' : '2px solid #dfb282',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase()}
                  </Avatar>
                </div>
              </Tooltip>
            </Dropdown>
          </div>
        </Header>

        {/* Main Content */}
        <Content
          style={{
            margin: isMobile ? '0 0 72px' : '20px 24px',
            padding: isMobile ? '12px 10px' : '0',
            background: 'transparent',
            overflow: 'auto',
          }}
        >
          <Outlet key={selectedChildId || 'default'} />
        </Content>

        {/* Bottom Navigation – mobile only */}
        {isMobile && <MobileBottomNav onOpenMenu={() => setMobileDrawerOpen(true)} />}
      </Layout>

      {/* Navigation Drawer for Mobile */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🍃</span>
            <span style={{ fontWeight: 800, color: '#243527' }}>Study Island Tracker</span>
          </div>
        }
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={280}
        bodyStyle={{ padding: 0, background: '#23412c' }}
        headerStyle={{ background: '#fcfbf8', borderBottom: '1px solid #e8dfd1' }}
      >
        {/* User Card in Drawer */}
        <div style={{ padding: '16px 20px', background: '#fdfcf9', borderBottom: '1px solid #e8dfd1' }}>
          <Space>
            <Avatar
              size={48}
              src={user?.avatar}
              icon={<UserOutlined />}
              style={{
                background: user?.role === 'PARENT' ? '#8d5b32' : '#2e5239',
                border: '2px solid #dfb282',
              }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#243527' }}>{user?.name}</div>
              <Tag color={user?.role === 'PARENT' ? 'gold' : 'green'} style={{ marginTop: 2, marginInlineEnd: 0, borderRadius: 6 }}>
                {user?.role === 'PARENT' ? '👨‍👩‍👧 Phụ huynh' : '🎓 Học sinh'}
              </Tag>
            </div>
          </Space>

          {/* If Student: show Link Code */}
          {user?.role === 'STUDENT' && user.linkCode && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                background: '#eaf3ec',
                border: '1px solid #b7d6be',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: '#2e5239', fontWeight: 700 }}>MÃ PHỤ HUYNH</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1c3523' }}>{user.linkCode}</div>
              </div>
              <Button size="small" type="primary" style={{ background: '#2e5239', borderRadius: 12 }} icon={<CopyOutlined />} onClick={handleCopyLinkCode}>
                Sao chép
              </Button>
            </div>
          )}

          {/* If Parent: show current child */}
          {user?.role === 'PARENT' && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: '#6e7f72', marginBottom: 2 }}>ĐANG THEO DÕI:</div>
              <div style={{ fontWeight: 700, color: '#2e5239', fontSize: 14 }}>
                👶 {selectedChild ? selectedChild.name : 'Chưa chọn con'}
              </div>
            </div>
          )}
        </div>

        {/* Menu Items in Drawer */}
        <div style={{ padding: '8px 0' }}>
          <Menu
            className="cozy-sidebar-menu"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={navMenuItems}
            onClick={({ key }) => {
              navigate(key);
              setMobileDrawerOpen(false);
            }}
            style={{ background: 'transparent', border: 'none' }}
          />
        </div>

        <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.15)' }} />

        <div style={{ padding: '12px 16px' }}>
          <Button
            danger
            block
            icon={<LogoutOutlined />}
            onClick={() => {
              setMobileDrawerOpen(false);
              clearAuth();
            }}
            style={{ borderRadius: 20 }}
          >
            Đăng xuất
          </Button>
        </div>
      </Drawer>

      {/* Modal: Parent links child */}
      <Modal
        title="👨‍👩‍👧 Kết nối với tài khoản Học sinh"
        open={isLinkModalOpen}
        onCancel={() => setIsLinkModalOpen(false)}
        onOk={() => linkForm.submit()}
        okText="Kết nối ngay"
        cancelText="Hủy"
        confirmLoading={linkLoading}
      >
        <div style={{ marginBottom: 16, color: '#595959' }}>
          Nhập <strong>Mã kết nối</strong> (dạng <code>STU-XXXXXX</code>) do học sinh cung cấp trong phần Hồ sơ / Cài đặt để theo dõi và quản lý lịch học của con.
        </div>
        <Form form={linkForm} layout="vertical" onFinish={handleLinkChild}>
          <Form.Item
            name="linkCode"
            label="Mã kết nối học sinh"
            rules={[{ required: true, message: 'Vui lòng nhập mã kết nối của con' }]}
          >
            <Input
              placeholder="Ví dụ: STU-DEMO01"
              size="large"
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, borderRadius: 10 }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Proactive Web Push Permission Modal for Safari, Chrome, Edge, Firefox */}
      <NotificationPermissionModal />
    </Layout>
  );
}
