import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Typography, Spin, Button, Space } from 'antd';
import {
  CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  DollarOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { scheduleApi } from '../../api/schedule.api';
import { paymentApi, statsApi } from '../../api/payment.api';
import { StatusBadge, TypeBadge } from '../../components/common/StatusBadge';
import type { Schedule, PaymentSummary, StudyStats } from '../../types';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [upcoming, setUpcoming] = useState<Schedule[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [todayRes, upcomingRes, payRes, statsRes] = await Promise.all([
          scheduleApi.getToday(),
          scheduleApi.getUpcoming(),
          paymentApi.getSummary(),
          statsApi.getStudy(),
        ]);
        setTodaySchedules(todayRes.data.data);
        setUpcoming(upcomingRes.data.data);
        setPaymentSummary(payRes.data.data);
        setStudyStats(statsRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 64 }} />;

  const getSubjectName = (s: Schedule) =>
    typeof s.subjectId === 'object' ? s.subjectId.name : '';
  const getSubjectColor = (s: Schedule) =>
    typeof s.subjectId === 'object' ? s.subjectId.color : '#1677ff';
  const getLocationName = (s: Schedule) =>
    typeof s.locationId === 'object' ? s.locationId?.name : '';

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        Dashboard – {dayjs().format('dddd, DD/MM/YYYY')}
      </Title>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Hôm nay" value={todaySchedules.length} prefix={<CalendarOutlined />} suffix="buổi" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Đã hoàn thành" value={studyStats?.completed ?? 0} prefix={<CheckCircleOutlined style={{ color: 'green' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Tổng giờ học" value={Math.round((studyStats?.totalMinutes ?? 0) / 60)} suffix="giờ" prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Còn nợ học phí"
              value={paymentSummary?.remainingAmount ?? 0}
              prefix={<DollarOutlined style={{ color: paymentSummary?.remainingAmount ? 'red' : 'green' }} />}
              formatter={(v) => `${Number(v).toLocaleString('vi-VN')} đ`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Today's Schedule */}
        <Col xs={24} lg={14}>
          <Card
            title="📅 Lịch hôm nay"
            extra={<Button type="link" onClick={() => navigate('/calendar')} icon={<ArrowRightOutlined />}>Xem lịch</Button>}
          >
            {todaySchedules.length === 0 ? (
              <Text type="secondary">Không có lịch học hôm nay 🎉</Text>
            ) : (
              <List
                dataSource={todaySchedules}
                renderItem={(s) => (
                  <List.Item
                    actions={[<StatusBadge status={s.status} />]}
                    style={{ borderLeft: `4px solid ${getSubjectColor(s)}`, paddingLeft: 12, marginBottom: 8 }}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{getSubjectName(s)}</Text>
                          <TypeBadge type={s.type} />
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">🕐 {s.startTime} – {s.endTime}</Text>
                          {getLocationName(s) && <Text type="secondary">📍 {getLocationName(s)}</Text>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* Upcoming + Payment */}
        <Col xs={24} lg={10}>
          <Card title="⏰ Sắp diễn ra" style={{ marginBottom: 16 }}>
            {upcoming.length === 0 ? (
              <Text type="secondary">Không có lịch sắp diễn ra</Text>
            ) : (
              <List
                size="small"
                dataSource={upcoming}
                renderItem={(s) => (
                  <List.Item>
                    <List.Item.Meta
                      title={getSubjectName(s)}
                      description={`${dayjs(s.date).format('DD/MM')} · ${s.startTime} – ${s.endTime}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card title="💰 Học phí">
            <Row gutter={8}>
              <Col span={8}>
                <Statistic title="Tổng" value={paymentSummary?.totalAmount ?? 0} formatter={(v) => `${Number(v).toLocaleString('vi-VN')}đ`} valueStyle={{ fontSize: 14 }} />
              </Col>
              <Col span={8}>
                <Statistic title="Đã trả" value={paymentSummary?.paidAmount ?? 0} formatter={(v) => `${Number(v).toLocaleString('vi-VN')}đ`} valueStyle={{ fontSize: 14, color: 'green' }} />
              </Col>
              <Col span={8}>
                <Statistic title="Còn lại" value={paymentSummary?.remainingAmount ?? 0} formatter={(v) => `${Number(v).toLocaleString('vi-VN')}đ`} valueStyle={{ fontSize: 14, color: 'red' }} />
              </Col>
            </Row>
            <Button type="link" onClick={() => navigate('/payments')} style={{ paddingLeft: 0, marginTop: 8 }}>
              Xem chi tiết →
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
