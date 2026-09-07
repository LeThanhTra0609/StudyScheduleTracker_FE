import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Badge,
  Avatar,
  Dropdown,
  Button,
  theme,
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
  TeamOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useSocket } from '../../hooks/useSocket';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { userApi } from '../../api/user.api';
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

  const { token } = theme.useToken();

  const userMenu = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{user?.email}</div>
          <Tag color={user?.role === 'PARENT' ? 'gold' : 'blue'} style={{ marginTop: 4 }}>
            {user?.role === 'PARENT' ? '👨‍👩‍👧 Phụ huynh' : '🎓 Học sinh'}
          </Tag>
        </div>
      ),
    },
    { type: 'divider' as const },
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ & Cài đặt', onClick: () => navigate('/settings') },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: clearAuth },
  ];

  // Parent: current selected child
  const childrenList = user?.children || [];
  const selectedChild = childrenList.find((c) => c._id === selectedChildId) || childrenList[0];

  const childDropdownItems = [
    ...childrenList.map((c) => ({
      key: c._id,
      label: (
        <Space style={{ width: '100%', justifyContent: 'space-between', padding: '4px 0' }}>
          <Space>
            <Avatar size="small" style={{ backgroundColor: c._id === selectedChild?._id ? '#52c41a' : token.colorPrimary }}>
              {c.name?.[0]?.toUpperCase() || 'C'}
            </Avatar>
            <span style={{ fontWeight: c._id === selectedChild?._id ? 600 : 400 }}>{c.name}</span>
          </Space>
          {c._id === selectedChild?._id && <Tag color="green" style={{ margin: 0 }}>Đang chọn</Tag>}
        </Space>
      ),
      onClick: () => {
        if (c._id !== selectedChildId) {
          setSelectedChildId(c._id);
          window.location.reload();
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
      window.location.reload();
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
        <Header
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 10px' : '0 16px',
            gap: 8,
          }}
        >
          {/* Left: Brand / Hamburger / Child selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: 18 }} />}
                onClick={() => setMobileDrawerOpen(true)}
                style={{ padding: '4px 8px' }}
              />
            )}

            <span
              onClick={() => navigate('/')}
              style={{
                fontWeight: 700,
                fontSize: isMobile ? 14 : 16,
                color: token.colorPrimary,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {isMobile ? '📚 Tracker' : '📚 Study Tracker'}
            </span>

            {/* PARENT: Multi-Child Selector */}
            {user?.role === 'PARENT' && (
              <>
                {childrenList.length > 0 ? (
                  <Dropdown menu={{ items: childDropdownItems }} trigger={['click']}>
                    <Button
                      size={isMobile ? 'small' : 'middle'}
                      style={{
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        maxWidth: isMobile ? 130 : 220,
                        padding: isMobile ? '0 8px' : '4px 12px',
                      }}
                    >
                      <TeamOutlined style={{ color: '#fa8c16', flexShrink: 0 }} />
                      <span
                        style={{
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: isMobile ? 12 : 14,
                        }}
                      >
                        {selectedChild ? selectedChild.name : 'Chọn con'}
                      </span>
                      <DownOutlined style={{ fontSize: 9, color: '#8c8c8c', flexShrink: 0 }} />
                    </Button>
                  </Dropdown>
                ) : (
                  <Button
                    size={isMobile ? 'small' : 'middle'}
                    type="dashed"
                    icon={<PlusOutlined />}
                    style={{ borderColor: '#fa8c16', color: '#fa8c16', fontSize: 12 }}
                    onClick={() => {
                      linkForm.resetFields();
                      setIsLinkModalOpen(true);
                    }}
                  >
                    {isMobile ? '+ Con' : 'Kết nối tài khoản con'}
                  </Button>
                )}
              </>
            )}

            {/* STUDENT: Display role & quick link code */}
            {user?.role === 'STUDENT' && user.linkCode && (
              <Tooltip title="Bấm để sao chép mã kết nối cho phụ huynh">
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={handleCopyLinkCode}
                  style={{
                    background: '#f5f5f5',
                    border: '1px dashed #d9d9d9',
                    fontSize: isMobile ? 11 : 12,
                    padding: '0 6px',
                  }}
                >
                  {isMobile ? user.linkCode : `Mã: ${user.linkCode}`}
                </Button>
              </Tooltip>
            )}
          </div>

          {/* Right Header actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12 }}>
            {!isMobile && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/schedules/new')}
                size="middle"
              >
                Thêm lịch
              </Button>
            )}

            <Badge count={unreadCount} size="small">
              <Button
                icon={<BellOutlined />}
                shape="circle"
                size={isMobile ? 'small' : 'middle'}
                onClick={() => navigate('/notifications')}
              />
            </Badge>

            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <Avatar
                src={user?.avatar}
                size={isMobile ? 28 : 32}
                icon={<UserOutlined />}
                style={{
                  cursor: 'pointer',
                  background: user?.role === 'PARENT' ? '#fa8c16' : token.colorPrimary,
                }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </Avatar>
            </Dropdown>
          </div>
        </Header>

        {/* Main Content */}
        <Content
          style={{
            margin: isMobile ? '0 0 72px' : '16px',
            padding: isMobile ? '12px 10px' : '24px',
            background: isMobile ? 'transparent' : token.colorBgContainer,
            borderRadius: isMobile ? 0 : token.borderRadius,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>

        {/* Bottom Navigation – mobile only */}
        {isMobile && <MobileBottomNav onOpenMenu={() => setMobileDrawerOpen(true)} />}
      </Layout>

      {/* Navigation Drawer for Mobile */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📚</span>
            <span style={{ fontWeight: 700, color: token.colorPrimary }}>Study Tracker</span>
          </div>
        }
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={280}
        bodyStyle={{ padding: 0 }}
      >
        {/* User Card in Drawer */}
        <div style={{ padding: '16px 20px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            <Avatar
              size={44}
              src={user?.avatar}
              icon={<UserOutlined />}
              style={{ background: user?.role === 'PARENT' ? '#fa8c16' : token.colorPrimary }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.name}</div>
              <Tag color={user?.role === 'PARENT' ? 'gold' : 'blue'} style={{ marginTop: 2, marginInlineEnd: 0 }}>
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
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: '#52c41a', fontWeight: 600 }}>MÃ PHỤ HUYNH</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#135200' }}>{user.linkCode}</div>
              </div>
              <Button size="small" type="primary" style={{ background: '#52c41a' }} icon={<CopyOutlined />} onClick={handleCopyLinkCode}>
                Sao chép
              </Button>
            </div>
          )}

          {/* If Parent: show current child */}
          {user?.role === 'PARENT' && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>ĐANG THEO DÕI:</div>
              <div style={{ fontWeight: 600, color: token.colorPrimary }}>
                👶 {selectedChild ? selectedChild.name : 'Chưa chọn con'}
              </div>
            </div>
          )}
        </div>

        {/* Menu Items in Drawer */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            navigate(key);
            setMobileDrawerOpen(false);
          }}
          style={{ border: 'none' }}
        />

        <Divider style={{ margin: '8px 0' }} />

        <div style={{ padding: '8px 16px' }}>
          <Button
            danger
            block
            icon={<LogoutOutlined />}
            onClick={() => {
              setMobileDrawerOpen(false);
              clearAuth();
            }}
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
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
