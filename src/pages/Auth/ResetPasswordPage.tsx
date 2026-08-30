import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, App } from 'antd';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';

const { Title } = Typography;

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const token = searchParams.get('token') || '';

  const onFinish = async ({ password }: { password: string }) => {
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Link không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <Title level={4}>Đặt lại mật khẩu</Title>

        {success ? (
          <Alert type="success" message="Đặt lại mật khẩu thành công! Đang chuyển hướng..." />
        ) : (
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item name="password" label="Mật khẩu mới" rules={[{ required: true, min: 6 }]}>
              <Input.Password size="large" />
            </Form.Item>
            <Form.Item
              name="confirm"
              label="Xác nhận mật khẩu"
              dependencies={['password']}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject('Mật khẩu không khớp');
                  },
                }),
              ]}
            >
              <Input.Password size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>Đặt lại mật khẩu</Button>
            </Form.Item>
          </Form>
        )}
        <div style={{ marginTop: 12 }}><Link to="/login">← Quay lại đăng nhập</Link></div>
      </Card>
    </div>
  );
}
