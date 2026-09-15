import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List,
  Button,
  Space,
  Typography,
  Empty,
  Tag,
  Badge,
  Card,
  Radio,
  Tooltip,
  Popconfirm,
  Spin,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  CheckOutlined,
  RightOutlined,
  TeamOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNotificationStore } from '../../store/notificationStore';
import { PageHeader } from '../../components/common/PageHeader';
import type { AppNotification } from '../../store/notificationStore';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

const typeIconMap: Record<string, { icon: React.ReactNode; bg: string; color: string; label: string }> = {
  reminder: {
    icon: <ClockCircleOutlined />,
    bg: '#e6f4ff',
    color: '#1677ff',
    label: 'Nhắc lịch học',
  },
  attendance: {
    icon: <CheckCircleOutlined />,
    bg: '#f6ffed',
    color: '#52c41a',
    label: 'Điểm danh',
  },
  payment: {
    icon: <DollarOutlined />,
    bg: '#fffbe6',
    color: '#faad14',
    label: 'Học phí',
  },
  family: {
    icon: <TeamOutlined />,
    bg: '#f9f0ff',
    color: '#722ed1',
    label: 'Gia đình',
  },
  schedule_change: {
    icon: <SyncOutlined />,
    bg: '#fff2e8',
    color: '#fa541c',
    label: 'Biến động lịch',
  },
  info: {
    icon: <BellOutlined />,
    bg: '#eaf3ec',
    color: '#2e5239',
    label: 'Hệ thống',
  },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllRead,
    markRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  const [filterType, setFilterType] = useState<'all' | 'unread' | 'reminder' | 'other'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'unread') return !n.read;
    if (filterType === 'reminder') return n.type === 'reminder';
    if (filterType === 'other') return n.type !== 'reminder';
    return true;
  });

  const handleItemClick = (n: AppNotification) => {
    if (!n.read) {
      markRead(n.id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 40 }}>
      {/* Top PageHeader */}
      <PageHeader
        title="Hộp thư thông báo"
        icon="🔔"
        subtitle="Theo dõi nhắc nhở trước giờ học, tin điểm danh tức thì và biến động lịch học"
        extra={
          <Space wrap>
            <Button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              icon={<CheckOutlined />}
              style={{
                borderRadius: 10,
                fontWeight: 600,
                borderColor: '#d9e2db',
                color: '#243527',
              }}
            >
              Đánh dấu tất cả đã đọc
            </Button>
            <Popconfirm
              title="Xóa tất cả thông báo?"
              description="Hành động này sẽ xóa toàn bộ lịch sử thông báo và không thể hoàn tác."
              onConfirm={clearAll}
              okText="Xóa sạch"
              cancelText="Hủy"
              disabled={notifications.length === 0}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={notifications.length === 0}
                style={{ borderRadius: 10, fontWeight: 600 }}
              >
                Xóa tất cả
              </Button>
            </Popconfirm>
          </Space>
        }
      />

      {/* Filter Tabs Bar */}
      <Card
        className="cozy-card"
        style={{
          marginBottom: 16,
          padding: '12px 18px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Radio.Group
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="all">
              Tất cả ({notifications.length})
            </Radio.Button>
            <Radio.Button value="unread">
              Chưa đọc <Badge count={unreadCount} size="small" offset={[4, -2]} />
            </Radio.Button>
            <Radio.Button value="reminder">
              ⏰ Nhắc lịch ({notifications.filter((n) => n.type === 'reminder').length})
            </Radio.Button>
            <Radio.Button value="other">
              Khác ({notifications.filter((n) => n.type !== 'reminder').length})
            </Radio.Button>
          </Radio.Group>

          <Button
            type="text"
            icon={<SyncOutlined spin={loading} />}
            onClick={() => fetchNotifications()}
            style={{ color: '#2e5239', fontWeight: 600 }}
          >
            Làm mới
          </Button>
        </div>
      </Card>

      {/* Notifications List */}
      <Card className="cozy-card" style={{ padding: '8px 12px' }}>
        {loading && notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: '#6e7f72' }}>Đang tải thông báo...</div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                filterType === 'unread'
                  ? 'Bạn đã đọc hết mọi thông báo!'
                  : 'Chưa có thông báo nào trong danh mục này'
              }
            />
          </div>
        ) : (
          <List
            dataSource={filteredNotifications}
            renderItem={(n) => {
              const typeConfig = typeIconMap[n.type] || typeIconMap.info;
              return (
                <List.Item
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    background: n.read ? 'transparent' : '#f4f8f5',
                    borderRadius: 14,
                    padding: '14px 18px',
                    marginBottom: 10,
                    cursor: n.link ? 'pointer' : 'default',
                    border: n.read ? '1px solid #eee6d8' : '1px solid #b7d6be',
                    borderLeft: n.read ? '4px solid #d9d0c3' : '4px solid #2e5239',
                    transition: 'all 0.2s ease',
                  }}
                  actions={[
                    n.link && (
                      <Tooltip key="open" title="Xem chi tiết">
                        <Button
                          type="text"
                          shape="circle"
                          icon={<RightOutlined style={{ color: '#2e5239', fontSize: 13 }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(n);
                          }}
                        />
                      </Tooltip>
                    ),
                    <Tooltip key="delete" title="Xóa thông báo này">
                      <Button
                        type="text"
                        danger
                        shape="circle"
                        icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(n.id);
                        }}
                      />
                    </Tooltip>,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: typeConfig.bg,
                          color: typeConfig.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                        }}
                      >
                        {typeConfig.icon}
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text strong={!n.read} style={{ fontSize: 14, color: n.read ? '#4a5b4e' : '#1c3523' }}>
                          {n.title || n.message}
                        </Text>
                        {!n.read && (
                          <Tag color="green" style={{ fontSize: 10, borderRadius: 8, padding: '0 6px', lineHeight: '18px' }}>
                            Mới
                          </Tag>
                        )}
                        <Tag
                          style={{
                            fontSize: 10,
                            borderRadius: 8,
                            padding: '0 6px',
                            lineHeight: '18px',
                            background: typeConfig.bg,
                            color: typeConfig.color,
                            border: 'none',
                          }}
                        >
                          {typeConfig.label}
                        </Tag>
                      </div>
                    }
                    description={
                      <div style={{ marginTop: 4 }}>
                        {n.title && n.message && n.title !== n.message && (
                          <Paragraph style={{ margin: '0 0 4px', color: '#4a5b4e', fontSize: 13 }}>
                            {n.message}
                          </Paragraph>
                        )}
                        <Text type="secondary" style={{ fontSize: 12, color: '#88988b' }}>
                          {dayjs(n.createdAt).fromNow()} • {dayjs(n.createdAt).format('HH:mm DD/MM/YYYY')}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}
