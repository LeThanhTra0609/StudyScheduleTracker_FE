import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Divider, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      const { token, user } = res.data;
      setAuth(user, token);
      sessionStorage.removeItem('push_prompt_dismissed');
      message.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>📚 Study Tracker</Title>
          <Text type="secondary">Đăng nhập vào tài khoản của bạn</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}>
            <Input prefix={<MailOutlined />} placeholder="email@example.com" size="large" />
          </Form.Item>

          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading} icon={<UserOutlined />}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Divider />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Chưa có tài khoản? </Text>
          <Link to="/register">Đăng ký ngay</Link>
        </div>
      </Card>
    </div>
  );
}
