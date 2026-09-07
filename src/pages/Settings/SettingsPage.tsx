import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Tabs,
  Checkbox,
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
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  CopyOutlined,
  TeamOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { authApi } from '../../api/auth.api';
import { userApi } from '../../api/user.api';
import { useAuthStore } from '../../store/authStore';

const { Title, Text, Paragraph } = Typography;

const REMINDER_OPTIONS = [
  { label: '5 phút trước', value: 5 },
  { label: '10 phút trước', value: 10 },
  { label: '30 phút trước', value: 30 },
  { label: '1 giờ trước', value: 60 },
  { label: '1 ngày trước', value: 1440 },
];

export default function SettingsPage() {
  const { user, setAuth, token, updateUser, setSelectedChildId } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [pwForm] = Form.useForm();
  const [linkForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      });
    }
  }, [user]);

  const saveProfile = async (values: { name: string; avatar?: string }) => {
    setLoading(true);
    try {
      const res = await authApi.updateProfile(values);
      setAuth(res.data.user, token!);
      message.success('Đã cập nhật hồ sơ');
    } catch {
      message.error('Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const saveNotifications = async (values: { reminderTimes: number[] }) => {
    try {
      await authApi.updateProfile({
        notificationPreferences: { reminderTimes: values.reminderTimes, emailNotifications: false },
      });
      message.success('Đã lưu cài đặt thông báo');
    } catch {
      message.error('Lưu thất bại');
    }
  };

  const changePassword = async (values: { currentPassword: string; newPassword: string }) => {
    setLoading(true);
    try {
      await authApi.login({ email: user!.email, password: values.currentPassword });
      await authApi.resetPassword({ token: 'change', password: values.newPassword });
      message.success('Đã đổi mật khẩu');
      pwForm.resetFields();
    } catch {
      message.error('Mật khẩu hiện tại không đúng');
    } finally {
      setLoading(false);
    }
  };

  // Copy student link code
  const copyLinkCode = () => {
    if (user?.linkCode) {
      navigator.clipboard.writeText(user.linkCode);
      message.success('Đã sao chép mã kết nối: ' + user.linkCode);
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
    <div style={{ maxWidth: 640 }}>
      <Title level={4}>⚙️ Cài đặt</Title>
      <Tabs
        items={[
          {
            key: 'profile',
            label: 'Hồ sơ',
            children: (
              <Card>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Avatar
                    size={80}
                    icon={<UserOutlined />}
                    src={user?.avatar}
                    style={{ background: user?.role === 'PARENT' ? '#fa8c16' : '#1677ff' }}
                  >
                    {user?.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <div>
                    <Title level={5} style={{ margin: '8px 0 0' }}>
                      {user?.name}
                    </Title>
                  </div>
                  <Text type="secondary">{user?.email}</Text>
                  <div style={{ marginTop: 6 }}>
                    <Tag color={user?.role === 'PARENT' ? 'gold' : 'blue'}>
                      {user?.role === 'PARENT' ? '👨‍👩‍👧 Tài khoản Phụ huynh' : '🎓 Tài khoản Học sinh'}
                    </Tag>
                  </div>
                </div>

                <Form form={profileForm} layout="vertical" onFinish={saveProfile}>
                  <Form.Item name="name" label="Họ và tên" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="email" label="Email">
                    <Input disabled />
                  </Form.Item>
                  <Form.Item name="avatar" label="URL ảnh đại diện">
                    <Input placeholder="https://..." />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                    Lưu thay đổi
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'family',
            label: '👨‍👩‍👧 Gia đình & Liên kết',
            children: (
              <Card>
                {/* STUDENT VIEW */}
                {user?.role === 'STUDENT' && (
                  <div>
                    <Title level={5}>Mã kết nối dành cho Phụ huynh</Title>
                    <Paragraph type="secondary">
                      Cung cấp mã này cho phụ huynh để phụ huynh có thể theo dõi thời khóa biểu, điểm danh và học phí của bạn trên hệ thống.
                    </Paragraph>
                    <div
                      style={{
                        padding: 16,
                        background: '#f6ffed',
                        border: '1px solid #b7eb8f',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, color: '#52c41a', fontWeight: 600 }}>MÃ KẾT NỐI CỦA BẠN</div>
                        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2, color: '#135200' }}>
                          {user?.linkCode || 'Chưa tạo'}
                        </div>
                      </div>
                      <Button
                        type="primary"
                        icon={<CopyOutlined />}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        onClick={copyLinkCode}
                      >
                        Sao chép mã
                      </Button>
                    </div>

                    <Alert
                      type="info"
                      showIcon
                      message="Phụ huynh sẽ đăng nhập tài khoản Phụ huynh, sau đó nhập mã kết nối này để bắt đầu liên kết."
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
                        <Title level={5} style={{ margin: 0 }}>
                          Danh sách con đang theo dõi ({childrenList.length})
                        </Title>
                        <Text type="secondary">
                          Bạn có thể thêm nhiều con và chuyển đổi theo dõi trên thanh tiêu đề
                        </Text>
                      </div>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          linkForm.resetFields();
                          setIsLinkModalOpen(true);
                        }}
                      >
                        Kết nối con
                      </Button>
                    </div>

                    {childrenList.length === 0 ? (
                      <Alert
                        type="warning"
                        showIcon
                        message="Chưa có học sinh nào được kết nối"
                        description="Vui lòng lấy Mã kết nối từ tài khoản học sinh của con và bấm 'Kết nối con' để bắt đầu quản lý."
                        style={{ marginBottom: 16 }}
                      />
                    ) : (
                      <List
                        dataSource={childrenList}
                        renderItem={(child) => (
                          <List.Item
                            actions={[
                              <Popconfirm
                                title="Hủy liên kết với học sinh này?"
                                okText="Hủy kết nối"
                                cancelText="Không"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => handleUnlinkChild(child._id)}
                              >
                                <Button type="text" danger icon={<DeleteOutlined />}>
                                  Hủy liên kết
                                </Button>
                              </Popconfirm>,
                            ]}
                          >
                            <List.Item.Meta
                              avatar={
                                <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />}>
                                  {child.name?.[0]?.toUpperCase()}
                                </Avatar>
                              }
                              title={<Text strong>{child.name}</Text>}
                              description={
                                <Space>
                                  <span>{child.email}</span>
                                  {child.linkCode && <Tag color="blue">{child.linkCode}</Tag>}
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </div>
                )}
              </Card>
            ),
          },
          {
            key: 'notifications',
            label: 'Thông báo',
            children: (
              <Card>
                <Form
                  layout="vertical"
                  onFinish={saveNotifications}
                  initialValues={{ reminderTimes: user?.notificationPreferences?.reminderTimes || [30] }}
                >
                  <Form.Item name="reminderTimes" label="Nhắc nhở trước giờ học">
                    <Checkbox.Group
                      options={REMINDER_OPTIONS}
                      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                    />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    Lưu cài đặt
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'account',
            label: 'Tài khoản',
            children: (
              <Card title="Đổi mật khẩu">
                <Form form={pwForm} layout="vertical" onFinish={changePassword}>
                  <Form.Item name="currentPassword" label="Mật khẩu hiện tại" rules={[{ required: true }]}>
                    <Input.Password />
                  </Form.Item>
                  <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true, min: 6 }]}>
                    <Input.Password />
                  </Form.Item>
                  <Form.Item
                    name="confirm"
                    label="Xác nhận mật khẩu mới"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                          return Promise.reject('Mật khẩu không khớp');
                        },
                      }),
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Đổi mật khẩu
                  </Button>
                </Form>
              </Card>
            ),
          },
        ]}
      />

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
          Nhập <strong>Mã kết nối</strong> (dạng <code>STU-XXXXXX</code>) do con bạn cung cấp để liên kết tài khoản.
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
    </div>
  );
}
