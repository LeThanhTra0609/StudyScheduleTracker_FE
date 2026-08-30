import { useState, useEffect } from 'react';
import { Form, Input, Button, Tabs, Checkbox, Switch, Typography, Card, App, Avatar, Space } from 'antd';
import { UserOutlined, SaveOutlined } from '@ant-design/icons';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;

const REMINDER_OPTIONS = [
  { label: '5 phút trước', value: 5 },
  { label: '10 phút trước', value: 10 },
  { label: '30 phút trước', value: 30 },
  { label: '1 giờ trước', value: 60 },
  { label: '1 ngày trước', value: 1440 },
];

export default function SettingsPage() {
  const { user, setAuth, token } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [pwForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
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
    } catch { message.error('Cập nhật thất bại'); }
    finally { setLoading(false); }
  };

  const saveNotifications = async (values: { reminderTimes: number[] }) => {
    try {
      await authApi.updateProfile({ notificationPreferences: { reminderTimes: values.reminderTimes, emailNotifications: false } });
      message.success('Đã lưu cài đặt thông báo');
    } catch { message.error('Lưu thất bại'); }
  };

  const changePassword = async (values: { currentPassword: string; newPassword: string }) => {
    setLoading(true);
    try {
      // Re-login to verify current password, then reset
      await authApi.login({ email: user!.email, password: values.currentPassword });
      await authApi.resetPassword({ token: 'change', password: values.newPassword });
      message.success('Đã đổi mật khẩu');
      pwForm.resetFields();
    } catch { message.error('Mật khẩu hiện tại không đúng'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <Title level={4}>⚙️ Cài đặt</Title>
      <Tabs
        items={[
          {
            key: 'profile',
            label: 'Hồ sơ',
            children: (
              <Card>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Avatar size={80} icon={<UserOutlined />} src={user?.avatar} style={{ background: '#1677ff' }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <div><Title level={5} style={{ margin: '8px 0 0' }}>{user?.name}</Title></div>
                  <Text type="secondary">{user?.email}</Text>
                </div>

                <Form form={profileForm} layout="vertical" onFinish={saveProfile}>
                  <Form.Item name="name" label="Họ và tên" rules={[{ required: true }]}><Input /></Form.Item>
                  <Form.Item name="email" label="Email"><Input disabled /></Form.Item>
                  <Form.Item name="avatar" label="URL ảnh đại diện"><Input placeholder="https://..." /></Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>Lưu thay đổi</Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'notifications',
            label: 'Thông báo',
            children: (
              <Card>
                <Form layout="vertical" onFinish={saveNotifications}
                  initialValues={{ reminderTimes: user ? [] : [] }}>
                  <Form.Item name="reminderTimes" label="Nhắc nhở trước giờ học">
                    <Checkbox.Group options={REMINDER_OPTIONS} style={{ display: 'flex', flexDirection: 'column', gap: 8 }} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Lưu cài đặt</Button>
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
                  <Button type="primary" htmlType="submit" loading={loading}>Đổi mật khẩu</Button>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
