import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, App } from 'antd';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { message } = App.useApp();

  const onFinish = async ({ email }: { email: string }) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <Title level={4}>Quên mật khẩu</Title>
        <Text type="secondary">Nhập email để nhận link đặt lại mật khẩu</Text>

        {sent ? (
          <Alert style={{ marginTop: 16 }} type="success" message="Đã gửi link đặt lại mật khẩu về email của bạn. Vui lòng kiểm tra hộp thư." />
        ) : (
          <Form layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="email@example.com" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>Gửi link đặt lại</Button>
            </Form.Item>
          </Form>
        )}

        <div style={{ marginTop: 16 }}>
          <Link to="/login">← Quay lại đăng nhập</Link>
        </div>
      </Card>
    </div>
  );
}
