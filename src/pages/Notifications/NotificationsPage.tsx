import { List, Button, Space, Typography, Empty, Tag, Badge } from 'antd';
import { BellOutlined, CheckCircleOutlined, DollarOutlined, ClockCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNotificationStore } from '../../store/notificationStore';
import type { AppNotification } from '../../store/notificationStore';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const typeIcon: Record<AppNotification['type'], React.ReactNode> = {
  attendance: <CheckCircleOutlined style={{ color: 'green' }} />,
  payment: <DollarOutlined style={{ color: '#faad14' }} />,
  reminder: <ClockCircleOutlined style={{ color: '#1677ff' }} />,
  info: <BellOutlined style={{ color: '#722ed1' }} />,
};

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotificationStore();

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Space>
          <Title level={4} style={{ margin: 0 }}>🔔 Thông báo</Title>
          {unreadCount > 0 && <Badge count={unreadCount} />}
        </Space>
        <Space>
          <Button onClick={markAllRead} disabled={unreadCount === 0}>Đánh dấu tất cả đã đọc</Button>
          <Button danger icon={<DeleteOutlined />} onClick={clearAll} disabled={notifications.length === 0}>Xóa tất cả</Button>
        </Space>
      </Space>

      {notifications.length === 0 ? (
        <Empty description="Không có thông báo nào" />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(n) => (
            <List.Item
              onClick={() => !n.read && markRead(n.id)}
              style={{
                background: n.read ? 'transparent' : '#f0f6ff',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 8,
                cursor: n.read ? 'default' : 'pointer',
                borderLeft: n.read ? '3px solid transparent' : '3px solid #1677ff',
              }}
            >
              <List.Item.Meta
                avatar={typeIcon[n.type]}
                title={
                  <Space>
                    <Text strong={!n.read}>{n.message}</Text>
                    {!n.read && <Tag color="blue" style={{ fontSize: 10 }}>Mới</Tag>}
                  </Space>
                }
                description={<Text type="secondary" style={{ fontSize: 12 }}>{dayjs(n.createdAt).fromNow()}</Text>}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
