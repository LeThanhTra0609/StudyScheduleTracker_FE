import { useEffect, useState } from 'react';
import { Typography, Button } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

const { Title } = Typography;

export interface PageHeaderProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
  onBack?: () => void;
  showGreeting?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function PageHeader({
  title,
  icon,
  subtitle,
  extra,
  onBack,
  showGreeting = true,
  children,
  style,
}: PageHeaderProps) {
  const { user } = useAuthStore();
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 30000);
    return () => clearInterval(timer);
  }, []);

  const greetHour = now.hour();
  const greeting = greetHour < 12 ? 'Chào buổi sáng' : greetHour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const displayName = user?.name ? user.name.split(' ').pop() : 'bạn';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #eef2ee',
        borderRadius: 20,
        padding: '20px 26px',
        marginBottom: 24,
        boxShadow: '0 4px 18px rgba(40, 60, 44, 0.05)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Top subtle greeting / realtime bar */}
      {showGreeting && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
            fontSize: 12,
            color: '#6e7f72',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarOutlined style={{ color: '#2e5239' }} />
            <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
              {now.format('dddd, DD/MM/YYYY')}
            </span>
            <span>·</span>
            <ClockCircleOutlined style={{ color: '#2e5239' }} />
            <span style={{ fontWeight: 700, color: '#2e5239' }}>{now.format('HH:mm')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#596e5d', fontWeight: 500 }}>
              {greeting}, <strong style={{ color: '#243527' }}>{displayName}</strong>! 👋
            </span>
          </div>
        </div>
      )}

      {/* Main Title & Extra Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 240, flex: 1 }}>
          {onBack && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              style={{
                borderRadius: 10,
                border: '1px solid #d9e2db',
                color: '#243527',
                fontWeight: 600,
              }}
            />
          )}

          {icon && (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #f0f7f2 0%, #e3efe7 100%)',
                border: '1px solid #d2e7d7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
                color: '#2e5239',
              }}
            >
              {icon}
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Title
                level={3}
                style={{
                  margin: 0,
                  fontWeight: 800,
                  color: '#243527',
                  fontSize: 22,
                  lineHeight: 1.2,
                }}
              >
                {title}
              </Title>
            </div>
            {subtitle && (
              <div style={{ fontSize: 13, color: '#6e7f72', marginTop: 4, lineHeight: 1.4 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {extra && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {extra}
          </div>
        )}
      </div>

      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}

export default PageHeader;
