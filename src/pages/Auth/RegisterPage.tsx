import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Divider, App, Radio } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values: { name: string; email: string; password: string; role?: string }) => {
    setLoading(true);
    try {
      const res = await authApi.register(values);
      const { token, user } = res.data;
      setAuth(user, token);
      message.success('Đăng ký thành công!');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '24px 16px' }}>
      <Card style={{ width: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Title level={3} style={{ margin: 0 }}>📚 Study Tracker</Title>
          <Text type="secondary">Tạo tài khoản mới</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="role" label="Vai trò của bạn" initialValue="STUDENT">
            <Radio.Group style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Radio.Button value="STUDENT" style={{ height: 'auto', padding: '10px 8px', textAlign: 'center', borderRadius: 8 }}>
                <div style={{ fontSize: 20 }}>🎓</div>
                <div style={{ fontWeight: 600 }}>Học sinh</div>
                <div style={{ fontSize: 11, color: '#8c8c8c' }}>Tự lên lịch học</div>
              </Radio.Button>
              <Radio.Button value="PARENT" style={{ height: 'auto', padding: '10px 8px', textAlign: 'center', borderRadius: 8 }}>
                <div style={{ fontSize: 20 }}>👨‍👩‍👧</div>
                <div style={{ fontWeight: 600 }}>Phụ huynh</div>
                <div style={{ fontSize: 11, color: '#8c8c8c' }}>Quản lý lịch con</div>
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input placeholder="Nguyễn Văn A" size="large" />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
            <Input placeholder="email@example.com" size="large" />
          </Form.Item>

          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }]}>
            <Input.Password placeholder="Mật khẩu" size="large" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Mật khẩu không khớp'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Đăng ký
            </Button>
          </Form.Item>
        </Form>

        <Divider />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Đã có tài khoản? </Text>
          <Link to="/login">Đăng nhập</Link>
        </div>
      </Card>
    </div>
  );
}
