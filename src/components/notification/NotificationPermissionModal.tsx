import { useState, useEffect } from 'react';
import { Modal, Button, Typography, Space, Tag, App } from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import {
  subscribeToWebPush,
  getNotificationPermission,
  isPushSupported,
  getBrowserInfo,
} from '../../utils/webPush';
import { playNotificationSound } from '../../utils/sound';

const { Title, Text, Paragraph } = Typography;

interface NotificationPermissionModalProps {
  onSuccess?: () => void;
}

export default function NotificationPermissionModal({ onSuccess }: NotificationPermissionModalProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const { message } = App.useApp();
  const browserInfo = getBrowserInfo();

  useEffect(() => {
    // Only check if Web Push is supported in this browser
    if (!isPushSupported()) return;

    // Check current permission
    const currentPermission = getNotificationPermission();

    // Check if user already dismissed the prompt in this session
    const isDismissed = sessionStorage.getItem('push_prompt_dismissed') === 'true';

    // Proactively show if permission is still 'default' (not granted, not denied) and not dismissed
    if (currentPermission === 'default' && !isDismissed) {
      // Delay 600ms so user has a smooth transition after logging in
      const timer = setTimeout(() => {
        setVisible(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnablePush = async () => {
    setLoading(true);
    try {
      // This click is a direct user activation gesture -> passes Safari & Chrome security checks!
      const res = await subscribeToWebPush();
      setSuccessState(true);
      playNotificationSound();
      message.success(res.message || 'Đã bật thông báo thành công!');

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setVisible(false);
      }, 1400);
    } catch (err: any) {
      // If user clicked 'Block' or cancelled
      const perm = getNotificationPermission();
      if (perm === 'denied') {
        message.warning(
          'Quyền thông báo bị từ chối. Bạn có thể bật lại bất cứ lúc nào trong mục Cài đặt hoặc cài đặt của trình duyệt.'
        );
      } else {
        message.error(err.message || 'Không thể bật thông báo.');
      }
      setVisible(false);
      sessionStorage.setItem('push_prompt_dismissed', 'true');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('push_prompt_dismissed', 'true');
    setVisible(false);
  };

  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      width={460}
      styles={{
        body: {
          borderRadius: 24,
          padding: '12px 8px',
          background: '#fdfcf9',
        },
      }}
    >
      <div style={{ textAlign: 'center', position: 'relative' }}>
        {/* Subtle close button */}
        <Button
          type="text"
          shape="circle"
          icon={<CloseOutlined style={{ color: '#8c8c8c' }} />}
          onClick={handleDismiss}
          style={{ position: 'absolute', top: -12, right: -12 }}
        />

        {/* Bell Icon Banner */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: successState
              ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
              : 'linear-gradient(135deg, #2e5239 0%, #44714f 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(46, 82, 57, 0.25)',
            marginBottom: 16,
            transition: 'all 0.3s ease',
          }}
        >
          {successState ? (
            <CheckCircleOutlined style={{ fontSize: 38, color: '#ffffff' }} />
          ) : (
            <BellOutlined style={{ fontSize: 36, color: '#ffffff' }} />
          )}
        </div>

        {/* Title & Tag */}
        <div style={{ marginBottom: 6 }}>
          <Tag color="green" style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
            🌐 {browserInfo.name}
          </Tag>
        </div>

        <Title level={3} style={{ margin: '6px 0 8px', color: '#1c3523', fontWeight: 800, fontSize: 20 }}>
          {successState ? 'Đã bật thông báo thành công!' : 'Bật thông báo để không lỡ lịch học'}
        </Title>

        <Paragraph style={{ color: '#526657', fontSize: 13, margin: '0 auto 20px', maxWidth: 380, lineHeight: 1.5 }}>
          {successState
            ? 'Từ bây giờ bạn sẽ nhận được thông báo nhắc nhở tự động trước mỗi buổi học.'
            : 'Nhận cảnh báo tự động trước giờ vào lớp (15 - 30 phút), cập nhật điểm danh và thông báo dời lịch ngay trên trình duyệt.'}
        </Paragraph>

        {/* Benefits Box */}
        {!successState && (
          <div
            style={{
              background: '#f4eee3',
              border: '1px solid #e8dfd1',
              borderRadius: 16,
              padding: '14px 16px',
              textAlign: 'left',
              marginBottom: 24,
            }}
          >
            <Space orientation="vertical" size={10} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ClockCircleOutlined style={{ color: '#2e5239', fontSize: 16 }} />
                <Text style={{ fontSize: 13, color: '#243527', fontWeight: 600 }}>
                  Nhắc trước giờ học 15 - 30 phút
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                <Text style={{ fontSize: 13, color: '#243527', fontWeight: 600 }}>
                  Thông báo điểm danh & dời lịch tức thì
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SafetyCertificateOutlined style={{ color: '#faad14', fontSize: 16 }} />
                <Text style={{ fontSize: 13, color: '#243527', fontWeight: 600 }}>
                  Hoạt động ngay cả khi đóng tab trình duyệt
                </Text>
              </div>
            </Space>
          </div>
        )}

        {/* Actions */}
        {!successState ? (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              block
              icon={<BellOutlined />}
              loading={loading}
              onClick={handleEnablePush}
              style={{
                height: 46,
                borderRadius: 22,
                fontWeight: 700,
                fontSize: 15,
                background: 'linear-gradient(135deg, #2e5239 0%, #44714f 100%)',
                boxShadow: '0 4px 14px rgba(46, 82, 57, 0.3)',
              }}
            >
              Bật thông báo ngay
            </Button>
            <Button
              type="text"
              block
              onClick={handleDismiss}
              style={{ color: '#6e7f72', fontWeight: 600, fontSize: 13 }}
            >
              Để sau
            </Button>
          </Space>
        ) : (
          <Button
            type="primary"
            size="large"
            block
            onClick={() => setVisible(false)}
            style={{
              height: 44,
              borderRadius: 20,
              background: '#2e5239',
              fontWeight: 700,
            }}
          >
            Đã hiểu
          </Button>
        )}
      </div>
    </Modal>
  );
}
