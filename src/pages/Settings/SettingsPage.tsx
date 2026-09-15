import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Switch,
  Typography,
  Card,
  App,
  Avatar,
  Space,
  Tag,
  List,
  Popconfirm,
  Modal,
  Alert,
  Row,
  Col,
  Select,
  Checkbox,
  Tooltip,
  Divider,
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  CopyOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  BellOutlined,
  ClockCircleOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  SoundOutlined,
  MailOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { authApi } from '../../api/auth.api';
import { userApi } from '../../api/user.api';
import { notificationApi } from '../../api/notification.api';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuthStore } from '../../store/authStore';
import {
  subscribeToWebPush,
  unsubscribeFromWebPush,
  checkIsSubscribed,
  getNotificationPermission,
  isPushSupported,
  showLocalTestNotification,
  getBrowserInfo,
} from '../../utils/webPush';
import { playNotificationSound } from '../../utils/sound';

const { Title, Text, Paragraph } = Typography;

// Preset avatar options
const AVATAR_PRESETS = [
  { id: 'bot1', name: 'Robot Học Giỏi', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=study1' },
  { id: 'bot2', name: 'Gấu Trúc Thông Minh', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Panda' },
  { id: 'bot3', name: 'Cú Mèo Siêng Năng', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Owl' },
  { id: 'bot4', name: 'Cáo Năng Động', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Fox' },
  { id: 'human1', name: 'Học Sinh Felix', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Felix' },
  { id: 'human2', name: 'Học Sinh Luna', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Luna' },
  { id: 'human3', name: 'Nhà Thám Hiểm Milo', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo' },
  { id: 'human4', name: 'Họa Sĩ Oliver', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Oliver' },
];

const REMINDER_TIME_OPTIONS = [
  { label: '⚡ 2 phút trước (Test / Khẩn cấp)', value: 2 },
  { label: '5 phút trước', value: 5 },
  { label: '15 phút trước', value: 15 },
  { label: '30 phút trước', value: 30 },
  { label: '1 giờ trước', value: 60 },
  { label: '2 giờ trước', value: 120 },
  { label: '1 ngày trước', value: 1440 },
];

const DAILY_TIME_OPTIONS = [
  { label: '🌅 06:30 sáng', value: '06:30' },
  { label: '🌅 07:00 sáng (Khuyên dùng)', value: '07:00' },
  { label: '🌅 07:30 sáng', value: '07:30' },
  { label: '🌅 08:00 sáng', value: '08:00' },
];

const ADVANCE_DAY_TIME_OPTIONS = [
  { label: '🌙 20:00 tối hôm trước (Khuyên dùng)', value: '20:00' },
  { label: '🌙 20:30 tối hôm trước', value: '20:30' },
  { label: '🌙 21:00 tối hôm trước', value: '21:00' },
  { label: '🌙 21:30 tối hôm trước', value: '21:30' },
];

export default function SettingsPage() {
  const { user, setAuth, token, updateUser, setSelectedChildId } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [pwForm] = Form.useForm();
  const [linkForm] = Form.useForm();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'family' | 'security'>('profile');
  const [loading, setLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.avatar || '');

  const { message } = App.useApp();

  // Watch switches for notification form
  const [classReminderOn, setClassReminderOn] = useState(true);
  const [dailyReminderOn, setDailyReminderOn] = useState(true);
  const [advanceDayReminderOn, setAdvanceDayReminderOn] = useState(true);

  // Web Push states & actions
  const [isPushSupportedBrowser] = useState(isPushSupported());
  const [isWebPushSubscribed, setIsWebPushSubscribed] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [webPushLoading, setWebPushLoading] = useState(false);
  const [testPushLoading, setTestPushLoading] = useState(false);

  useEffect(() => {
    if (isPushSupportedBrowser) {
      checkIsSubscribed().then(setIsWebPushSubscribed);
      setPushPermission(getNotificationPermission());
    }
  }, [isPushSupportedBrowser]);

  const handleToggleWebPush = async (checked: boolean) => {
    setWebPushLoading(true);
    try {
      if (checked) {
        const res = await subscribeToWebPush();
        setIsWebPushSubscribed(true);
        setPushPermission(getNotificationPermission());
        message.success(res.message || 'Đã bật thông báo đẩy thành công!');
      } else {
        const res = await unsubscribeFromWebPush();
        setIsWebPushSubscribed(false);
        message.success(res.message || 'Đã tắt nhận thông báo đẩy.');
      }
    } catch (err: any) {
      message.error(err.message || 'Không thể thay đổi cài đặt thông báo đẩy');
      setIsWebPushSubscribed(await checkIsSubscribed());
    } finally {
      setWebPushLoading(false);
    }
  };

  const handleTestWebPush = async () => {
    setTestPushLoading(true);
    try {
      playNotificationSound();

      // Trigger local OS push via Service Worker
      await showLocalTestNotification(
        '🔔 [Thử nghiệm] Nhắc nhở lịch học',
        'Đây là cách thông báo xuất hiện trực tiếp trên thiết bị của bạn trước mỗi buổi học.'
      );

      // Trigger server push
      const res = await notificationApi.testPush();
      message.success(res.data.message || 'Đã gửi thông báo thử nghiệm ra màn hình!');
    } catch (err: any) {
      message.info('Đã phát thông báo thử nghiệm trên trình duyệt của bạn.');
    } finally {
      setTestPushLoading(false);
    }
  };

  // Sync initial values
  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
      setSelectedAvatar(user.avatar || '');

      const prefs = user.notificationPreferences || {
        reminderTimes: [30],
        emailNotifications: false,
      };

      setClassReminderOn(prefs.classReminder !== false);
      setDailyReminderOn(prefs.dailyReminder !== false);
      setAdvanceDayReminderOn(prefs.advanceDayReminder !== false);

      notificationForm.setFieldsValue({
        classReminder: prefs.classReminder !== false,
        reminderTimes: prefs.reminderTimes || [30],
        dailyReminder: prefs.dailyReminder !== false,
        dailyReminderTime: prefs.dailyReminderTime || '07:00',
        advanceDayReminder: prefs.advanceDayReminder !== false,
        advanceDayReminderTime: prefs.advanceDayReminderTime || '20:00',
        attendanceAlerts: prefs.attendanceAlerts !== false,
        scheduleChangeAlerts: prefs.scheduleChangeAlerts !== false,
        paymentDueAlerts: prefs.paymentDueAlerts !== false,
        soundEnabled: prefs.soundEnabled !== false,
        emailNotifications: prefs.emailNotifications || false,
      });
    }
  }, [user]);

  // Save profile
  const saveProfile = async (values: { name: string; avatar?: string; phone?: string; bio?: string }) => {
    setLoading(true);
    try {
      const res = await authApi.updateProfile({
        name: values.name,
        avatar: selectedAvatar || values.avatar,
        phone: values.phone,
        bio: values.bio,
      });
      setAuth(res.data.user, token!);
      message.success('Đã cập nhật hồ sơ thành công!');
    } catch {
      message.error('Cập nhật hồ sơ thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Save notifications
  const saveNotifications = async (values: any) => {
    setNotifLoading(true);
    try {
      const notificationPreferences = {
        reminderTimes: values.reminderTimes || [30],
        emailNotifications: !!values.emailNotifications,
        classReminder: !!values.classReminder,
        dailyReminder: !!values.dailyReminder,
        dailyReminderTime: values.dailyReminderTime || '07:00',
        advanceDayReminder: !!values.advanceDayReminder,
        advanceDayReminderTime: values.advanceDayReminderTime || '20:00',
        attendanceAlerts: !!values.attendanceAlerts,
        scheduleChangeAlerts: !!values.scheduleChangeAlerts,
        paymentDueAlerts: !!values.paymentDueAlerts,
        soundEnabled: !!values.soundEnabled,
      };

      const res = await authApi.updateProfile({ notificationPreferences });
      setAuth(res.data.user, token!);
      message.success('Đã lưu toàn bộ cài đặt thông báo!');
    } catch {
      message.error('Lưu cài đặt thông báo thất bại');
    } finally {
      setNotifLoading(false);
    }
  };

  // Change password
  const changePassword = async (values: { currentPassword: string; newPassword: string }) => {
    setLoading(true);
    try {
      await authApi.login({ email: user!.email, password: values.currentPassword });
      await authApi.resetPassword({ token: 'change', password: values.newPassword });
      message.success('Đã đổi mật khẩu thành công!');
      pwForm.resetFields();
    } catch {
      message.error('Mật khẩu hiện tại không chính xác');
    } finally {
      setLoading(false);
    }
  };

  // Copy student link code
  const copyLinkCode = () => {
    if (user?.linkCode) {
      navigator.clipboard.writeText(user.linkCode);
      message.success(`Đã sao chép mã kết nối: ${user.linkCode}`);
    }
  };

  // Parent links child
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

  // Parent unlinks child
  const handleUnlinkChild = async (studentId: string) => {
    try {
      await userApi.unlinkChild(studentId);
      message.success('Đã hủy liên kết với học sinh');
      const profileRes = await userApi.getProfile();
      updateUser(profileRes.data.user);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể hủy liên kết');
    }
  };

  const childrenList = user?.children || [];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      {/* Top Banner Header */}
      <PageHeader
        title="Hồ sơ & Cài đặt hệ thống"
        icon="⚙️"
        subtitle="Tùy chỉnh thông tin tài khoản, cấu hình thông báo và quản lý liên kết tài khoản"
      />

      <Row gutter={[24, 24]}>
        {/* Left Column: Identity Card & Navigation */}
        <Col xs={24} lg={8}>
          {/* User Identity Card */}
          <Card
            className="cozy-card"
            style={{
              padding: 0,
              overflow: 'hidden',
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            {/* Cover header */}
            <div
              style={{
                height: 80,
                background: 'linear-gradient(135deg, #dfb282 0%, #8d5b32 100%)',
                position: 'relative',
              }}
            />

            {/* Avatar & Info */}
            <div style={{ padding: '0 20px 24px', marginTop: -44, position: 'relative' }}>
              <div style={{ display: 'inline-block', position: 'relative' }}>
                <Avatar
                  size={88}
                  src={selectedAvatar || user?.avatar}
                  icon={<UserOutlined />}
                  style={{
                    background: user?.role === 'PARENT' ? '#8d5b32' : '#2e5239',
                    border: '4px solid #fdfcf9',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  }}
                >
                  {user?.name?.[0]?.toUpperCase()}
                </Avatar>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#52c41a',
                    border: '3px solid #fdfcf9',
                  }}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#243527' }}>
                  {user?.name}
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {user?.email}
                </Text>
              </div>

              <div style={{ marginTop: 10 }}>
                <Tag
                  color={user?.role === 'PARENT' ? 'gold' : 'green'}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {user?.role === 'PARENT' ? '👨‍👩‍👧 Phụ huynh' : '🎓 Học sinh'}
                </Tag>
              </div>

              {/* Student Link Code Display */}
              {user?.role === 'STUDENT' && user.linkCode && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '10px 14px',
                    background: '#eaf3ec',
                    border: '1px dashed #b7d6be',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#2e5239' }}>MÃ LIÊN KẾT PHỤ HUYNH</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1c3523', letterSpacing: 1 }}>{user.linkCode}</div>
                  </div>
                  <Tooltip title="Sao chép mã kết nối">
                    <Button
                      size="small"
                      type="primary"
                      icon={<CopyOutlined />}
                      onClick={copyLinkCode}
                      style={{ background: '#2e5239', borderRadius: 10 }}
                    />
                  </Tooltip>
                </div>
              )}

              {/* Parent Children Count */}
              {user?.role === 'PARENT' && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '10px 14px',
                    background: '#f9f4ed',
                    border: '1px solid #e8dfd1',
                    borderRadius: 14,
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: 11, color: '#6e7f72', fontWeight: 600 }}>TÀI KHOẢN HỌC SINH ĐÃ NỐI</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#8d5b32' }}>
                    👶 {childrenList.length} học sinh
                  </div>
                </div>
              )}

              <Divider style={{ margin: '18px 0 14px', borderColor: '#e8dfd1' }} />

              {/* Account Quick Stats */}
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#6e7f72', fontWeight: 600 }}>TRẠNG THÁI</div>
                  <div style={{ color: '#52c41a', fontWeight: 700, fontSize: 13, marginTop: 2 }}>🟢 Kích hoạt</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6e7f72', fontWeight: 600 }}>BẢO MẬT</div>
                  <div style={{ color: '#2e5239', fontWeight: 700, fontSize: 13, marginTop: 2 }}>🛡️ Cấp cao</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Navigation Menu Pill */}
          <Card className="cozy-card" style={{ padding: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { key: 'profile', icon: <UserOutlined />, label: 'Thông tin cá nhân' },
                { key: 'notifications', icon: <BellOutlined />, label: 'Cài đặt thông báo đa loại' },
                { key: 'family', icon: <TeamOutlined />, label: 'Gia đình & Liên kết' },
                { key: 'security', icon: <LockOutlined />, label: 'Bảo mật & Mật khẩu' },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <Button
                    key={tab.key}
                    type="text"
                    icon={tab.icon}
                    onClick={() => setActiveTab(tab.key as any)}
                    style={{
                      height: 44,
                      justifyContent: 'flex-start',
                      borderRadius: 14,
                      fontWeight: isActive ? 700 : 600,
                      fontSize: 14,
                      background: isActive ? 'linear-gradient(135deg, #2e5239 0%, #44714f 100%)' : 'transparent',
                      color: isActive ? '#ffffff' : '#243527',
                      boxShadow: isActive ? '0 4px 12px rgba(46, 82, 57, 0.25)' : 'none',
                      transition: 'all 0.2s ease',
                      padding: '0 16px',
                    }}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Right Column: Tab Panels */}
        <Col xs={24} lg={16}>
          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === 'profile' && (
            <Card className="cozy-card" style={{ padding: '8px 12px' }}>
              <div style={{ marginBottom: 20 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#243527' }}>
                  Thông tin tài khoản
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Cập nhật họ tên, số điện thoại, lời giới thiệu và ảnh đại diện của bạn.
                </Text>
              </div>

              {/* Avatar Preset Selector */}
              <div
                style={{
                  background: '#f9f6f0',
                  border: '1px solid #e8dfd1',
                  borderRadius: 16,
                  padding: '16px',
                  marginBottom: 24,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: '#243527', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🎨</span>
                  <span>Chọn nhanh ảnh đại diện mẫu:</span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {AVATAR_PRESETS.map((preset) => {
                    const isPicked = selectedAvatar === preset.url;
                    return (
                      <Tooltip key={preset.id} title={preset.name}>
                        <div
                          onClick={() => {
                            setSelectedAvatar(preset.url);
                            profileForm.setFieldValue('avatar', preset.url);
                          }}
                          style={{
                            cursor: 'pointer',
                            padding: 3,
                            borderRadius: '50%',
                            border: isPicked ? '3px solid #2e5239' : '3px solid transparent',
                            transform: isPicked ? 'scale(1.1)' : 'scale(1)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Avatar size={42} src={preset.url} style={{ background: '#eaf3ec' }} />
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              <Form form={profileForm} layout="vertical" onFinish={saveProfile}>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="name" label={<span style={{ fontWeight: 700 }}>Họ và tên</span>} rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                      <Input size="large" style={{ borderRadius: 12 }} placeholder="Nguyễn Văn A" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="email" label={<span style={{ fontWeight: 700 }}>Địa chỉ Email (Đăng nhập)</span>}>
                      <Input size="large" disabled style={{ borderRadius: 12, background: '#f4eee3' }} prefix={<LockOutlined style={{ color: '#8c8c8c' }} />} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="phone" label={<span style={{ fontWeight: 700 }}>Số điện thoại liên hệ</span>}>
                      <Input size="large" style={{ borderRadius: 12 }} placeholder="0912 345 678" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="avatar" label={<span style={{ fontWeight: 700 }}>Hoặc dán URL ảnh đại diện</span>}>
                      <Input
                        size="large"
                        style={{ borderRadius: 12 }}
                        placeholder="https://..."
                        onChange={(e) => setSelectedAvatar(e.target.value)}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="bio" label={<span style={{ fontWeight: 700 }}>Mục tiêu học tập & Ghi chú cá nhân</span>}>
                  <Input.TextArea
                    rows={3}
                    style={{ borderRadius: 12 }}
                    placeholder="Ví dụ: Ôn thi Đại học khối A1, nâng cao điểm Toán và duy trì thói quen làm bài tập mỗi tối..."
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={loading}
                  style={{
                    background: 'linear-gradient(135deg, #2e5239 0%, #44714f 100%)',
                    borderRadius: 20,
                    fontWeight: 700,
                    height: 44,
                    padding: '0 28px',
                    boxShadow: '0 4px 12px rgba(46, 82, 57, 0.25)',
                  }}
                >
                  Lưu thay đổi hồ sơ
                </Button>
              </Form>
            </Card>
          )}

          {/* TAB 2: CÀI ĐẶT THÔNG BÁO ĐA LOẠI */}
          {activeTab === 'notifications' && (
            <Card className="cozy-card" style={{ padding: '8px 12px' }}>
              <div style={{ marginBottom: 20 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#243527' }}>
                  Cấu hình thông báo đa loại
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Tùy chỉnh các mốc thời gian nhắc nhở trước giờ học, thông báo tổng kết lịch học hôm nay và điểm danh.
                </Text>
              </div>

              <Form form={notificationForm} layout="vertical" onFinish={saveNotifications}>
                {/* 1. Nhắc trước giờ học */}
                <div
                  style={{
                    background: '#fdfcf9',
                    border: '1px solid #e8dfd1',
                    borderRadius: 16,
                    padding: '16px 20px',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Space>
                      <span style={{ fontSize: 18 }}>⏰</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#243527' }}>
                          1. Nhắc nhở trước giờ học (Class Reminders)
                        </div>
                        <div style={{ fontSize: 12, color: '#6e7f72' }}>
                          Gửi thông báo đẩy trước mỗi buổi học để học sinh chuẩn bị vào lớp.
                        </div>
                      </div>
                    </Space>
                    <Form.Item name="classReminder" valuePropName="checked" noStyle>
                      <Switch
                        checked={classReminderOn}
                        onChange={(checked) => setClassReminderOn(checked)}
                        style={{ background: classReminderOn ? '#2e5239' : '#d9d9d9' }}
                      />
                    </Form.Item>
                  </div>

                  {classReminderOn && (
                    <div style={{ marginTop: 14, paddingLeft: 28 }}>
                      <Form.Item
                        name="reminderTimes"
                        label={<span style={{ fontWeight: 600, fontSize: 13, color: '#2e5239' }}>Chọn các mốc thời gian nhắc:</span>}
                        style={{ marginBottom: 0 }}
                      >
                        <Checkbox.Group
                          options={REMINDER_TIME_OPTIONS}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                            gap: 10,
                          }}
                        />
                      </Form.Item>
                    </div>
                  )}
                </div>

                {/* 2. Nhắc tổng hợp lịch học hôm nay */}
                <div
                  style={{
                    background: '#fdfcf9',
                    border: '1px solid #e8dfd1',
                    borderRadius: 16,
                    padding: '16px 20px',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Space>
                      <span style={{ fontSize: 18 }}>🌅</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#243527' }}>
                          2. Nhắc lịch học hôm nay (Daily Morning Briefing)
                        </div>
                        <div style={{ fontSize: 12, color: '#6e7f72' }}>
                          Tổng hợp danh sách các môn, giờ học và địa điểm trong ngày vào đầu buổi sáng.
                        </div>
                      </div>
                    </Space>
                    <Form.Item name="dailyReminder" valuePropName="checked" noStyle>
                      <Switch
                        checked={dailyReminderOn}
                        onChange={(checked) => setDailyReminderOn(checked)}
                        style={{ background: dailyReminderOn ? '#2e5239' : '#d9d9d9' }}
                      />
                    </Form.Item>
                  </div>

                  {dailyReminderOn && (
                    <div style={{ marginTop: 14, paddingLeft: 28, maxWidth: 300 }}>
                      <Form.Item
                        name="dailyReminderTime"
                        label={<span style={{ fontWeight: 600, fontSize: 13, color: '#2e5239' }}>Thời điểm gửi thông báo sáng:</span>}
                        style={{ marginBottom: 0 }}
                      >
                        <Select size="middle" options={DAILY_TIME_OPTIONS} style={{ borderRadius: 10 }} />
                      </Form.Item>
                    </div>
                  )}
                </div>

                {/* 3. Nhắc chuẩn bị cho ngày mai */}
                <div
                  style={{
                    background: '#fdfcf9',
                    border: '1px solid #e8dfd1',
                    borderRadius: 16,
                    padding: '16px 20px',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Space>
                      <span style={{ fontSize: 18 }}>🌙</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#243527' }}>
                          3. Chuẩn bị lịch học ngày mai (Tomorrow Evening Reminder)
                        </div>
                        <div style={{ fontSize: 12, color: '#6e7f72' }}>
                          Nhắc nhở kiểm tra sách vở, hoàn thành bài tập về nhà cho ngày mai.
                        </div>
                      </div>
                    </Space>
                    <Form.Item name="advanceDayReminder" valuePropName="checked" noStyle>
                      <Switch
                        checked={advanceDayReminderOn}
                        onChange={(checked) => setAdvanceDayReminderOn(checked)}
                        style={{ background: advanceDayReminderOn ? '#2e5239' : '#d9d9d9' }}
                      />
                    </Form.Item>
                  </div>

                  {advanceDayReminderOn && (
                    <div style={{ marginTop: 14, paddingLeft: 28, maxWidth: 300 }}>
                      <Form.Item
                        name="advanceDayReminderTime"
                        label={<span style={{ fontWeight: 600, fontSize: 13, color: '#2e5239' }}>Thời điểm gửi thông báo tối:</span>}
                        style={{ marginBottom: 0 }}
                      >
                        <Select size="middle" options={ADVANCE_DAY_TIME_OPTIONS} style={{ borderRadius: 10 }} />
                      </Form.Item>
                    </div>
                  )}
                </div>

                {/* 4. Điểm danh & Biến động lịch */}
                <div
                  style={{
                    background: '#fdfcf9',
                    border: '1px solid #e8dfd1',
                    borderRadius: 16,
                    padding: '16px 20px',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#243527', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📝</span>
                    <span>4. Điểm danh & Cập nhật biến động lớp học</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#243527' }}>
                          Thông báo khi có điểm danh mới
                        </div>
                        <div style={{ fontSize: 11, color: '#6e7f72' }}>
                          Báo ngay khi giáo viên hoặc học sinh điểm danh (Có mặt, Vắng, Đi muộn)
                        </div>
                      </div>
                      <Form.Item name="attendanceAlerts" valuePropName="checked" noStyle>
                        <Switch style={{ background: '#2e5239' }} />
                      </Form.Item>
                    </div>

                    <Divider style={{ margin: '4px 0', borderColor: '#f0eae0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#243527' }}>
                          Thông báo dời hoặc hủy buổi học
                        </div>
                        <div style={{ fontSize: 11, color: '#6e7f72' }}>
                          Báo động khi có thay đổi giờ học, đổi phòng học hoặc nghỉ đột xuất
                        </div>
                      </div>
                      <Form.Item name="scheduleChangeAlerts" valuePropName="checked" noStyle>
                        <Switch style={{ background: '#2e5239' }} />
                      </Form.Item>
                    </div>
                  </div>
                </div>

                {/* 5. Học phí & Kênh thông báo */}
                <div
                  style={{
                    background: '#fdfcf9',
                    border: '1px solid #e8dfd1',
                    borderRadius: 16,
                    padding: '16px 20px',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#243527', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🔔</span>
                    <span>5. Học phí & Kênh nhận thông báo</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#243527' }}>
                          Nhắc hạn nộp học phí
                        </div>
                        <div style={{ fontSize: 11, color: '#6e7f72' }}>
                          Gửi cảnh báo trước 3 ngày khi đến hạn thanh toán học phí
                        </div>
                      </div>
                      <Form.Item name="paymentDueAlerts" valuePropName="checked" noStyle>
                        <Switch style={{ background: '#2e5239' }} />
                      </Form.Item>
                    </div>

                    <Divider style={{ margin: '4px 0', borderColor: '#f0eae0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#243527' }}>
                          Phát âm thanh chuông thông báo
                        </div>
                        <div style={{ fontSize: 11, color: '#6e7f72' }}>
                          Âm thanh khi nhận thông báo đẩy trực tiếp trên website
                        </div>
                      </div>
                      <Form.Item name="soundEnabled" valuePropName="checked" noStyle>
                        <Switch style={{ background: '#2e5239' }} />
                      </Form.Item>
                    </div>

                    <Divider style={{ margin: '4px 0', borderColor: '#f0eae0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#243527' }}>
                          Nhận thông báo qua Email
                        </div>
                        <div style={{ fontSize: 11, color: '#6e7f72' }}>
                          Gửi bản tin tổng hợp lịch học và báo cáo tuần đến hòm thư của bạn
                        </div>
                      </div>
                      <Form.Item name="emailNotifications" valuePropName="checked" noStyle>
                        <Switch style={{ background: '#2e5239' }} />
                      </Form.Item>
                    </div>
                  </div>
                </div>

                {/* 6. Thông báo đẩy Web Push trên trình duyệt & Thử nghiệm */}
                <div
                  style={{
                    background: '#fdfcf9',
                    border: '1px solid #e8dfd1',
                    borderRadius: 16,
                    padding: '16px 20px',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#243527', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🚀</span>
                    <span>6. Thông báo đẩy Web Push & Thử nghiệm hệ thống</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 28 }}>
                    {/* Push switch */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#243527' }}>
                          Bật nhận thông báo đẩy trên thiết bị này (Web Push)
                        </div>
                        <div style={{ fontSize: 11, color: '#6e7f72' }}>
                          Nhận thông báo lịch học ngay cả khi tắt tab trình duyệt qua Service Worker chuẩn W3C
                        </div>
                        <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {!isPushSupportedBrowser ? (
                            <Tag color="red">Trình duyệt không hỗ trợ Web Push</Tag>
                          ) : pushPermission === 'granted' ? (
                            <Tag color="green">Đã cấp quyền thông báo trình duyệt</Tag>
                          ) : pushPermission === 'denied' ? (
                            <Tag color="error">Đang bị chặn quyền thông báo</Tag>
                          ) : (
                            <Tag color="orange">Chưa cấp quyền thông báo</Tag>
                          )}
                          {isWebPushSubscribed && (
                            <Tag color="blue">Đang kết nối nhận thông báo đẩy</Tag>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={isWebPushSubscribed}
                        loading={webPushLoading}
                        disabled={!isPushSupportedBrowser}
                        onChange={handleToggleWebPush}
                        style={{ background: isWebPushSubscribed ? '#2e5239' : '#d9d9d9' }}
                      />
                    </div>

                    {/* Permission guide if denied */}
                    {pushPermission === 'denied' && (
                      <Alert
                        type="warning"
                        showIcon
                        message="Quyền thông báo đang bị tắt trong trình duyệt"
                        description={
                          <div style={{ fontSize: 12 }}>
                            Để nhận thông báo khi đóng web, hãy bấm vào <strong>biểu tượng ổ khóa/cài đặt trang web</strong> bên trái thanh địa chỉ URL của trình duyệt &rarr; Chuyển mục <strong>Thông báo (Notifications)</strong> sang <strong>Cho phép (Allow)</strong> &rarr; Tải lại trang.
                          </div>
                        }
                        style={{ borderRadius: 12 }}
                      />
                    )}

                    {/* PWA Install Tip Box */}
                    <div
                      style={{
                        background: '#f4eee3',
                        border: '1px solid #e8dfd1',
                        borderRadius: 12,
                        padding: '12px 14px',
                        fontSize: 12,
                        color: '#435649',
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, color: '#2e5239' }}>
                        <span>💡</span>
                        <span>Mẹo nhận thông báo chuẩn như App di động:</span>
                      </div>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0, lineHeight: 1.6 }}>
                        <li>
                          <strong>Trên Máy tính (Chrome/Edge):</strong> Bấm nút <em>"Cài đặt ứng dụng / Install App"</em> ở góc phải thanh địa chỉ để mở cửa sổ riêng biệt và nhận thông báo đẩy ngay góc màn hình Windows/Mac.
                        </li>
                        <li>
                          <strong>Trên iPhone / iPad (iOS Safari):</strong> Bấm nút <em>Chia sẻ (Share)</em> &rarr; Chọn <em>"Thêm vào Màn hình chính (Add to Home Screen)"</em> để bật tính năng nhận thông báo đẩy trên iOS.
                        </li>
                        <li>
                          <strong>Trên Điện thoại Android (Chrome):</strong> Bấm menu 3 chấm &rarr; Chọn <em>"Cài đặt ứng dụng"</em> hoặc <em>"Thêm vào màn hình chính"</em>.
                        </li>
                      </ul>
                    </div>

                    <Divider style={{ margin: '4px 0', borderColor: '#f0eae0' }} />

                    {/* Test push & sound buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#243527' }}>
                          Thử nghiệm thông báo & Âm thanh
                        </div>
                        <div style={{ fontSize: 11, color: '#6e7f72' }}>
                          Kiểm tra xem thiết bị của bạn có nhận được thông báo đẩy và chuông báo hay không
                        </div>
                      </div>
                      <Space wrap>
                        <Button
                          size="middle"
                          icon={<SoundOutlined />}
                          onClick={() => {
                            playNotificationSound();
                            message.info('Đang phát chuông thử nghiệm...');
                          }}
                          style={{ borderRadius: 12, fontWeight: 600 }}
                        >
                          Thử chuông
                        </Button>
                        <Button
                          type="primary"
                          size="middle"
                          icon={<BellOutlined />}
                          loading={testPushLoading}
                          onClick={handleTestWebPush}
                          style={{
                            background: '#2e5239',
                            borderRadius: 12,
                            fontWeight: 600,
                          }}
                        >
                          Gửi thông báo test
                        </Button>
                      </Space>
                    </div>
                  </div>
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={notifLoading}
                  style={{
                    background: 'linear-gradient(135deg, #2e5239 0%, #44714f 100%)',
                    borderRadius: 20,
                    fontWeight: 700,
                    height: 44,
                    padding: '0 28px',
                    boxShadow: '0 4px 12px rgba(46, 82, 57, 0.25)',
                  }}
                >
                  Lưu cài đặt thông báo
                </Button>
              </Form>
            </Card>
          )}

          {/* TAB 3: GIA ĐÌNH & LIÊN KẾT */}
          {activeTab === 'family' && (
            <Card className="cozy-card" style={{ padding: '8px 12px' }}>
              <div style={{ marginBottom: 20 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#243527' }}>
                  Kết nối thành viên gia đình
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Liên kết tài khoản giữa Phụ huynh và Học sinh để cùng theo dõi tiến độ học tập.
                </Text>
              </div>

              {/* STUDENT VIEW */}
              {user?.role === 'STUDENT' && (
                <div>
                  <div
                    style={{
                      padding: 24,
                      background: 'linear-gradient(135deg, #eaf3ec 0%, #d8ebd7 100%)',
                      border: '2px solid #b7d6be',
                      borderRadius: 18,
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#2e5239', fontWeight: 800, letterSpacing: 1 }}>
                          MÃ KẾT NỐI TÀI KHOẢN CỦA BẠN
                        </div>
                        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 3, color: '#1c3523', margin: '4px 0' }}>
                          {user?.linkCode || 'Chưa tạo'}
                        </div>
                        <div style={{ fontSize: 13, color: '#52825b' }}>
                          Cung cấp mã này cho ba mẹ để ba mẹ kết nối tài khoản theo dõi lịch học.
                        </div>
                      </div>
                      <Button
                        type="primary"
                        size="large"
                        icon={<CopyOutlined />}
                        onClick={copyLinkCode}
                        style={{
                          background: '#2e5239',
                          borderColor: '#2e5239',
                          borderRadius: 16,
                          fontWeight: 700,
                          height: 44,
                          padding: '0 20px',
                        }}
                      >
                        Sao chép mã
                      </Button>
                    </div>
                  </div>

                  <Alert
                    type="info"
                    showIcon
                    message="Cách hoạt động"
                    description="Phụ huynh tải ứng dụng hoặc truy cập hệ thống bằng tài khoản Phụ huynh, sau đó nhập mã kết nối này ở mục 'Kết nối con' để xem lịch học, điểm danh và học phí của bạn."
                    style={{ borderRadius: 14 }}
                  />
                </div>
              )}

              {/* PARENT VIEW */}
              {user?.role === 'PARENT' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <Title level={5} style={{ margin: 0, fontWeight: 700, color: '#243527' }}>
                        Danh sách con đang theo dõi ({childrenList.length})
                      </Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Bạn có thể chuyển đổi nhanh học sinh đang theo dõi trên thanh tiêu đề ngang.
                      </Text>
                    </div>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        linkForm.resetFields();
                        setIsLinkModalOpen(true);
                      }}
                      style={{
                        background: '#2e5239',
                        borderRadius: 16,
                        fontWeight: 700,
                        height: 38,
                      }}
                    >
                      Kết nối thêm con
                    </Button>
                  </div>

                  {childrenList.length === 0 ? (
                    <Alert
                      type="warning"
                      showIcon
                      message="Chưa có học sinh nào được kết nối"
                      description="Vui lòng lấy Mã kết nối (dạng STU-XXXXXX) từ tài khoản học sinh của con và bấm 'Kết nối thêm con' để bắt đầu đồng hành cùng con."
                      style={{ borderRadius: 14 }}
                    />
                  ) : (
                    <List
                      dataSource={childrenList}
                      renderItem={(child) => (
                        <div
                          key={child._id}
                          style={{
                            background: '#fdfcf9',
                            border: '1px solid #e8dfd1',
                            borderRadius: 14,
                            padding: '14px 16px',
                            marginBottom: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Space size={14}>
                            <Avatar
                              size={44}
                              src={child.avatar}
                              style={{ backgroundColor: '#2e5239' }}
                            >
                              {child.name?.[0]?.toUpperCase()}
                            </Avatar>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#243527' }}>{child.name}</div>
                              <Space style={{ fontSize: 12, color: '#6e7f72' }}>
                                <span>{child.email}</span>
                                {child.linkCode && <Tag color="green" style={{ borderRadius: 6 }}>{child.linkCode}</Tag>}
                              </Space>
                            </div>
                          </Space>
                          <Popconfirm
                            title="Hủy kết nối với học sinh này?"
                            description="Bạn sẽ không còn xem được lịch học của con cho đến khi kết nối lại."
                            okText="Hủy kết nối"
                            cancelText="Giữ lại"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleUnlinkChild(child._id)}
                          >
                            <Button type="text" danger icon={<DeleteOutlined />}>
                              Hủy kết nối
                            </Button>
                          </Popconfirm>
                        </div>
                      )}
                    />
                  )}
                </div>
              )}
            </Card>
          )}

          {/* TAB 4: BẢO MẬT & MẬT KHẨU */}
          {activeTab === 'security' && (
            <Card className="cozy-card" style={{ padding: '8px 12px' }}>
              <div style={{ marginBottom: 20 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#243527' }}>
                  Đổi mật khẩu tài khoản
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Khuyến nghị đổi mật khẩu định kỳ để bảo vệ dữ liệu học tập cá nhân.
                </Text>
              </div>

              <Form form={pwForm} layout="vertical" onFinish={changePassword} style={{ maxWidth: 440 }}>
                <Form.Item
                  name="currentPassword"
                  label={<span style={{ fontWeight: 700 }}>Mật khẩu hiện tại</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                >
                  <Input.Password size="large" style={{ borderRadius: 12 }} placeholder="••••••••" />
                </Form.Item>

                <Form.Item
                  name="newPassword"
                  label={<span style={{ fontWeight: 700 }}>Mật khẩu mới</span>}
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                  ]}
                >
                  <Input.Password size="large" style={{ borderRadius: 12 }} placeholder="Tối thiểu 6 ký tự" />
                </Form.Item>

                <Form.Item
                  name="confirm"
                  label={<span style={{ fontWeight: 700 }}>Xác nhận mật khẩu mới</span>}
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận lại mật khẩu' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                      },
                    }),
                  ]}
                >
                  <Input.Password size="large" style={{ borderRadius: 12 }} placeholder="Nhập lại mật khẩu mới" />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SafetyCertificateOutlined />}
                  loading={loading}
                  style={{
                    background: 'linear-gradient(135deg, #2e5239 0%, #44714f 100%)',
                    borderRadius: 20,
                    fontWeight: 700,
                    height: 44,
                    padding: '0 28px',
                    boxShadow: '0 4px 12px rgba(46, 82, 57, 0.25)',
                  }}
                >
                  Cập nhật mật khẩu mới
                </Button>
              </Form>
            </Card>
          )}
        </Col>
      </Row>

      {/* Modal: Parent links child */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>👨‍👩‍👧</span>
            <span style={{ fontWeight: 800, color: '#243527' }}>Kết nối với tài khoản Học sinh</span>
          </div>
        }
        open={isLinkModalOpen}
        onCancel={() => setIsLinkModalOpen(false)}
        onOk={() => linkForm.submit()}
        okText="Kết nối ngay"
        cancelText="Hủy"
        confirmLoading={linkLoading}
      >
        <div style={{ marginBottom: 16, color: '#595959', fontSize: 13 }}>
          Nhập <strong>Mã kết nối</strong> (dạng <code>STU-XXXXXX</code>) do học sinh cung cấp trong phần Hồ sơ của con để đồng bộ thời khóa biểu và điểm danh.
        </div>
        <Form form={linkForm} layout="vertical" onFinish={handleLinkChild}>
          <Form.Item
            name="linkCode"
            label={<span style={{ fontWeight: 700 }}>Mã kết nối học sinh</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mã kết nối của con' }]}
          >
            <Input
              placeholder="Ví dụ: STU-DEMO01"
              size="large"
              style={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, borderRadius: 12 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
