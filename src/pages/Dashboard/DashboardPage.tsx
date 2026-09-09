import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Typography,
  Spin,
  Button,
  Space,
  Tag,
  Badge,
  Alert,
  Tooltip,
  Avatar,
  Progress,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  EnvironmentOutlined,
  BookOutlined,
  UserOutlined,
  StarFilled,
  BulbOutlined,
  CheckSquareOutlined,
  CompassOutlined,
  CreditCardOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { scheduleApi } from '../../api/schedule.api';
import { paymentApi, statsApi } from '../../api/payment.api';
import { subjectApi } from '../../api/subject.api';
import { locationApi } from '../../api/location.api';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge, TypeBadge } from '../../components/common/StatusBadge';
import type { Schedule, PaymentSummary, StudyStats, Subject, Location } from '../../types';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [upcoming, setUpcoming] = useState<Schedule[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, selectedChildId } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [todayRes, upcomingRes, payRes, statsRes, subRes, locRes] = await Promise.all([
          scheduleApi.getToday(),
          scheduleApi.getUpcoming(),
          paymentApi.getSummary(),
          statsApi.getStudy(),
          subjectApi.getAll(),
          locationApi.getAll(),
        ]);
        setTodaySchedules(todayRes.data.data);
        setUpcoming(upcomingRes.data.data);
        setPaymentSummary(payRes.data.data);
        setStudyStats(statsRes.data.data);
        setSubjects(subRes.data.data || []);
        setLocations(locRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [selectedChildId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#6e7f72', fontWeight: 600 }}>
          🍃 Đang nạp dữ liệu Study Island...
        </div>
      </div>
    );
  }

  const getSubjectName = (s: Schedule) =>
    typeof s.subjectId === 'object' && s.subjectId ? s.subjectId.name : '';
  const getSubjectColor = (s: Schedule) =>
    typeof s.subjectId === 'object' && s.subjectId?.color ? s.subjectId.color : '#2e5239';
  const getLocationName = (s: Schedule) =>
    typeof s.locationId === 'object' && s.locationId ? s.locationId.name : '';

  // Calculate statistics
  const completedTodayCount = todaySchedules.filter((s) => s.status === 'COMPLETED').length;
  const todayProgressPercent =
    todaySchedules.length > 0 ? Math.round((completedTodayCount / todaySchedules.length) * 100) : 100;

  const totalStudyHours = Math.round((studyStats?.totalMinutes ?? 0) / 60);
  const paidPercent =
    paymentSummary && paymentSummary.totalAmount > 0
      ? Math.round((paymentSummary.paidAmount / paymentSummary.totalAmount) * 100)
      : 100;

  // Next session text
  const nextSession = todaySchedules.find((s) => s.status === 'UPCOMING') || upcoming[0];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 32 }}>
      {/* ─── 1. HERO GREETING BANNER (Cozy Island Style) ─── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #eef5ee 0%, #e2ede4 50%, #d8e6db 100%)',
          borderRadius: 24,
          padding: '24px 28px',
          border: '1px solid #cbe0d0',
          boxShadow: '0 4px 18px rgba(36, 53, 39, 0.05)',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ marginBottom: 6 }}>
            <Title level={3} style={{ margin: 0, color: '#1c3523', fontWeight: 800 }}>
              Chào mừng trở lại!
            </Title>
          </div>
          <Text style={{ color: '#415d47', fontSize: 15, fontWeight: 500 }}>
            Đây là tổng quan lịch học và tiến độ trên <strong>Study Island</strong> của bạn hôm nay 🌲
          </Text>
        </div>

        {/* Quick Date / Time / Semester Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid #cbe0d0',
              fontWeight: 600,
              fontSize: 13,
              color: '#2e5239',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CalendarOutlined />
            <span>{dayjs().format('dddd, DD/MM/YYYY')}</span>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid #cbe0d0',
              fontWeight: 600,
              fontSize: 13,
              color: '#2e5239',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ClockCircleOutlined />
            <span>{dayjs().format('HH:mm')}</span>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid #cbe0d0',
              fontWeight: 700,
              fontSize: 13,
              color: '#8d5b32',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>⛅</span>
            <span>Học kỳ 1</span>
          </div>
        </div>
      </div>

      {/* ─── 2. TUITION ALERT BANNER (If overdue or due soon) ─── */}
      {paymentSummary &&
        ((paymentSummary.overdueCount ?? 0) > 0 || (paymentSummary.dueSoonCount ?? 0) > 0) && (
          <Alert
            type={(paymentSummary.overdueCount ?? 0) > 0 ? 'error' : 'warning'}
            showIcon
            message={
              (paymentSummary.overdueCount ?? 0) > 0
                ? `⚠️ Bạn có ${paymentSummary.overdueCount} khoản học phí đã QUÁ HẠN nộp!`
                : `⏰ Bạn có ${paymentSummary.dueSoonCount} khoản học phí sắp đến hạn nộp trong 7 ngày tới.`
            }
            description="Hãy kiểm tra và cập nhật trạng thái đóng học phí để không gián đoạn lịch học nhé."
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => navigate('/payments')}
                style={{ borderRadius: 16, background: '#2e5239', borderColor: '#2e5239' }}
              >
                Xem & Nộp ngay
              </Button>
            }
            style={{
              borderRadius: 18,
              border: '1px solid #ebd3ba',
              background: '#fcf6ee',
              marginBottom: 24,
            }}
          />
        )}

      {/* ─── 3. TOP ROW: 3 CARDS (Overview, Today's Tasks, Upcoming Class) ─── */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {/* CARD 1: 🌱 Tổng quan học tập (Overview) */}
        <Col xs={24} md={12} lg={8}>
          <div
            className="cozy-card"
            style={{
              padding: '22px 24px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🌱</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#243527' }}>Tổng quan</span>
                </div>
                <Tag color="green" style={{ borderRadius: 12, fontWeight: 700 }}>
                  Tuần {dayjs().isoWeek()}
                </Tag>
              </div>

              {/* Chuyên cần stars */}
              <div
                style={{
                  background: '#f7f4ed',
                  padding: '12px 16px',
                  borderRadius: 16,
                  border: '1px solid #e7ded0',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 11, color: '#6e7f72', fontWeight: 600, marginBottom: 4 }}>
                  CHUYÊN CẦN HỌC TẬP
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space>
                    <StarFilled style={{ color: '#faad14', fontSize: 16 }} />
                    <StarFilled style={{ color: '#faad14', fontSize: 16 }} />
                    <StarFilled style={{ color: '#faad14', fontSize: 16 }} />
                    <StarFilled style={{ color: '#faad14', fontSize: 16 }} />
                    <StarFilled style={{ color: '#faad14', fontSize: 16 }} />
                  </Space>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#8d5b32' }}>5.0 / 5.0 ⭐</span>
                </div>
              </div>

              {/* Stat rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6e7f72', fontSize: 13 }}>⏱️ Tổng giờ học tích lũy:</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#1c3523' }}>
                    {totalStudyHours} giờ học
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6e7f72', fontSize: 13 }}>✅ Buổi học đã hoàn thành:</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#4a7c59' }}>
                    {studyStats?.completed ?? 0} buổi
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6e7f72', fontSize: 13 }}>📅 Lịch học hôm nay:</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#2e5239' }}>
                    {todaySchedules.length} buổi
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom mini highlight */}
            <div
              style={{
                marginTop: 20,
                padding: '10px 14px',
                background: '#eef5ee',
                borderRadius: 14,
                border: '1px solid #cbe0d0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>🎓</span>
              <div style={{ fontSize: 12, color: '#2e5239', fontWeight: 600 }}>
                {user?.role === 'PARENT'
                  ? 'Bạn đang theo dõi học tập của con'
                  : 'Mục tiêu tuần: Hoàn thành đầy đủ 100% tiết học!'}
              </div>
            </div>
          </div>
        </Col>

        {/* CARD 2: 📝 Lịch học hôm nay & Nhiệm vụ (Today's Classes & Tasks) */}
        <Col xs={24} md={12} lg={8}>
          <div
            className="cozy-card"
            style={{
              padding: '22px 24px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📝</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#243527' }}>
                    Lịch hôm nay ({todaySchedules.length})
                  </span>
                </div>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate('/calendar')}
                  style={{ color: '#2e5239', fontWeight: 700, padding: 0 }}
                >
                  Xem lịch ➔
                </Button>
              </div>

              {/* Progress bar for today */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: '#6e7f72',
                  }}
                >
                  <span>Tiến độ hoàn thành</span>
                  <span>
                    {completedTodayCount} / {todaySchedules.length} buổi
                  </span>
                </div>
                <div className="cozy-progress">
                  <div
                    className="cozy-progress-bar"
                    style={{ width: `${todayProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* List of Today's Sessions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todaySchedules.length === 0 ? (
                  <div
                    style={{
                      padding: '30px 16px',
                      textAlign: 'center',
                      background: '#fcfbf8',
                      borderRadius: 16,
                      border: '1px dashed #e6ded0',
                      color: '#6e7f72',
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🎉</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#243527' }}>
                      Không có lịch học hôm nay!
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Hãy nghỉ ngơi và thư giãn nhé!</div>
                  </div>
                ) : (
                  todaySchedules.slice(0, 3).map((s) => (
                    <div
                      key={s._id}
                      onClick={() => navigate('/calendar')}
                      style={{
                        padding: '10px 14px',
                        background: '#fcfbf8',
                        borderRadius: 14,
                        border: '1px solid #e7ded0',
                        borderLeft: `5px solid ${getSubjectColor(s)}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#243527' }}>
                          {getSubjectName(s)}
                        </span>
                        <StatusBadge status={s.status} />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#6e7f72',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <span>
                          🕒 {s.startTime} – {s.endTime}
                        </span>
                        {getLocationName(s) && <span>📍 {getLocationName(s)}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Add button */}
            <div style={{ marginTop: 16 }}>
              <Button
                block
                icon={<CheckSquareOutlined />}
                onClick={() => navigate('/attendance')}
                style={{
                  borderRadius: 18,
                  background: '#f4eee3',
                  border: '1px solid #dfd4c2',
                  color: '#2e5239',
                  fontWeight: 700,
                }}
              >
                Vào trang Điểm danh
              </Button>
            </div>
          </div>
        </Col>

        {/* CARD 3: ⏰ Tiết học sắp tới (Upcoming Class) */}
        <Col xs={24} md={24} lg={8}>
          <div
            className="cozy-card"
            style={{
              padding: '22px 24px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>⏰</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#243527' }}>
                    Sắp diễn ra
                  </span>
                </div>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate('/schedules')}
                  style={{ color: '#2e5239', fontWeight: 700, padding: 0 }}
                >
                  Xem tất cả ➔
                </Button>
              </div>

              {/* Featured Next Class Card */}
              {nextSession ? (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #fdfaf3 0%, #f6efe2 100%)',
                    borderRadius: 16,
                    padding: '16px',
                    border: '1px solid #e7dcc9',
                    marginBottom: 14,
                    boxShadow: '0 2px 8px rgba(141, 91, 50, 0.06)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Tag color="orange" style={{ borderRadius: 8, fontWeight: 700 }}>
                      Buổi học kế tiếp
                    </Tag>
                    <TypeBadge type={nextSession.type} />
                  </div>

                  <div style={{ fontWeight: 800, fontSize: 16, color: '#1c3523', marginBottom: 6 }}>
                    {getSubjectName(nextSession)}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#6e7f72',
                      marginBottom: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div>
                      📅 {dayjs(nextSession.date).format('dddd, DD/MM/YYYY')}
                    </div>
                    <div>
                      🕒 <strong>{nextSession.startTime} – {nextSession.endTime}</strong>
                    </div>
                    {getLocationName(nextSession) && (
                      <div>📍 {getLocationName(nextSession)}</div>
                    )}
                    {nextSession.teacher && (
                      <div>👨‍🏫 {nextSession.teacher}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '30px 16px',
                    textAlign: 'center',
                    background: '#fcfbf8',
                    borderRadius: 16,
                    border: '1px dashed #e6ded0',
                    color: '#6e7f72',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🍃</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#243527' }}>
                    Không có lịch học sắp tới
                  </div>
                </div>
              )}

              {/* Other upcoming classes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {upcoming.slice(1, 3).map((s) => (
                  <div
                    key={s._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fcfbf8',
                      borderRadius: 10,
                      border: '1px solid #eee5d7',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#243527' }}>
                      {getSubjectName(s)}
                    </span>
                    <span style={{ color: '#6e7f72' }}>
                      {dayjs(s.date).format('DD/MM')} · {s.startTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick button */}
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                block
                onClick={() => navigate('/schedules/new')}
                style={{
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, #2e5239 0%, #44714f 100%)',
                  borderColor: '#2e5239',
                  fontWeight: 700,
                }}
              >
                + Thêm lịch học mới
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* ─── 4. MIDDLE ROW: 3 CARDS (Subjects, Locations, Tuition) ─── */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {/* CARD 4: 🎒 Môn học (Subjects Collection) */}
        <Col xs={24} md={12} lg={8}>
          <div
            className="cozy-card"
            style={{
              padding: '22px 24px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📚</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#243527' }}>
                    Môn học ({subjects.length})
                  </span>
                </div>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate('/subjects')}
                  style={{ color: '#2e5239', fontWeight: 700, padding: 0 }}
                >
                  Quản lý ➔
                </Button>
              </div>

              {/* Subject badges grid */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {subjects.length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Chưa có môn học nào được tạo.
                  </Text>
                ) : (
                  subjects.map((sub) => (
                    <div
                      key={sub._id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#f7f4ed',
                        padding: '6px 12px',
                        borderRadius: 16,
                        border: '1px solid #e7ded0',
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: sub.color || '#2e5239',
                        }}
                      />
                      <span style={{ fontWeight: 700, fontSize: 12, color: '#243527' }}>
                        {sub.name}
                      </span>
                      {sub.code && (
                        <span style={{ fontSize: 10, color: '#8c8c8c' }}>({sub.code})</span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Goal Progress */}
              <div
                style={{
                  background: '#eef5ee',
                  borderRadius: 14,
                  padding: '12px 14px',
                  border: '1px solid #cbe0d0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#2e5239',
                    marginBottom: 6,
                  }}
                >
                  <span>Mục tiêu chuyên cần</span>
                  <span>{studyStats?.completed ? '85%' : '0%'}</span>
                </div>
                <Progress
                  percent={studyStats?.completed ? 85 : 0}
                  strokeColor="#2e5239"
                  trailColor="#d1e5d7"
                  showInfo={false}
                />
              </div>
            </div>

            <Button
              block
              onClick={() => navigate('/subjects')}
              style={{
                marginTop: 16,
                borderRadius: 18,
                background: '#f4eee3',
                border: '1px solid #dfd4c2',
                fontWeight: 700,
                color: '#2e5239',
              }}
            >
              + Thêm môn học mới
            </Button>
          </div>
        </Col>

        {/* CARD 5: 🗺️ Địa điểm học (Study Locations) */}
        <Col xs={24} md={12} lg={8}>
          <div
            className="cozy-card"
            style={{
              padding: '22px 24px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📍</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#243527' }}>
                    Địa điểm học ({locations.length})
                  </span>
                </div>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate('/locations')}
                  style={{ color: '#2e5239', fontWeight: 700, padding: 0 }}
                >
                  Bản đồ ➔
                </Button>
              </div>

              {/* Location items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {locations.length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Chưa có địa điểm nào được lưu.
                  </Text>
                ) : (
                  locations.slice(0, 3).map((loc) => (
                    <div
                      key={loc._id}
                      style={{
                        padding: '10px 14px',
                        background: '#fcfbf8',
                        borderRadius: 14,
                        border: '1px solid #e7ded0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#243527' }}>
                          {loc.name}
                        </div>
                        {loc.address && (
                          <div style={{ fontSize: 11, color: '#6e7f72', marginTop: 2 }}>
                            {loc.address}
                          </div>
                        )}
                      </div>
                      {loc.mapLink && (
                        <Button
                          type="text"
                          size="small"
                          href={loc.mapLink}
                          target="_blank"
                          icon={<CompassOutlined style={{ color: '#2e5239', fontSize: 16 }} />}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button
              block
              onClick={() => navigate('/locations')}
              style={{
                marginTop: 16,
                borderRadius: 18,
                background: '#f4eee3',
                border: '1px solid #dfd4c2',
                fontWeight: 700,
                color: '#2e5239',
              }}
            >
              + Quản lý địa điểm
            </Button>
          </div>
        </Col>

        {/* CARD 6: 💰 Học phí & Nợ phí (Tuition Tracker) */}
        <Col xs={24} md={24} lg={8}>
          <div
            className="cozy-card"
            style={{
              padding: '22px 24px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🪙</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#243527' }}>
                    Học phí & Nợ phí
                  </span>
                </div>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate('/payments')}
                  style={{ color: '#2e5239', fontWeight: 700, padding: 0 }}
                >
                  Chi tiết ➔
                </Button>
              </div>

              {/* Tuition overview pills */}
              <div
                style={{
                  background: '#fbf8f2',
                  padding: '14px 16px',
                  borderRadius: 16,
                  border: '1px solid #e7ded0',
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <span style={{ color: '#6e7f72', fontSize: 12, fontWeight: 600 }}>
                    TỔNG HỌC PHÍ:
                  </span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#1c3523' }}>
                    {(paymentSummary?.totalAmount ?? 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#6e7f72',
                      marginBottom: 4,
                    }}
                  >
                    <span>Đã thanh toán ({paidPercent}%)</span>
                    <span style={{ color: '#4a7c59' }}>
                      {(paymentSummary?.paidAmount ?? 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <Progress
                    percent={paidPercent}
                    strokeColor="#4a7c59"
                    trailColor="#e8dfd1"
                    showInfo={false}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 8,
                    borderTop: '1px dashed #e8ded0',
                  }}
                >
                  <span style={{ color: '#8d5b32', fontSize: 12, fontWeight: 700 }}>
                    Còn lại cần nộp:
                  </span>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: paymentSummary?.remainingAmount ? '#cf1322' : '#4a7c59',
                    }}
                  >
                    {(paymentSummary?.remainingAmount ?? 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="primary"
              block
              icon={<CreditCardOutlined />}
              onClick={() => navigate('/payments')}
              style={{
                marginTop: 14,
                borderRadius: 18,
                background: '#8d5b32',
                borderColor: '#8d5b32',
                fontWeight: 700,
              }}
            >
              Vào trang Quản lý Học phí
            </Button>
          </div>
        </Col>
      </Row>

      {/* ─── 5. BOTTOM ROW: GÓC GHI CHÚ & LỜI NHẮC HỌC TẬP (Anteckningar / Notes) ─── */}
      <div
        className="cozy-card"
        style={{
          padding: '24px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <span style={{ fontWeight: 800, fontSize: 17, color: '#243527' }}>
            Góc ghi chú & Cảm hứng học tập
          </span>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div
              style={{
                background: '#f8f5ee',
                borderRadius: 16,
                padding: '16px',
                border: '1px solid #e7ded0',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#2e5239',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>📌</span>
                <span>Chiến lược học tập</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: '#595959' }}>
                Ôn tập lại nội dung bài học trong vòng <strong>24 giờ</strong> sau khi tan lớp.
                Điều này giúp củng cố 80% kiến thức trước khi rơi vào đường cong quên lãng (Ebbinghaus).
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div
              style={{
                background: '#f8f5ee',
                borderRadius: 16,
                padding: '16px',
                border: '1px solid #e7ded0',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#8d5b32',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>☕</span>
                <span>Phương pháp Pomodoro</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: '#595959' }}>
                Chia buổi học thành các khoảng <strong>25 phút tập trung cao độ</strong> và{' '}
                <strong>5 phút nghỉ ngơi</strong>. Uống nước và rời mắt khỏi màn hình để duy trì năng lượng.
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div
              style={{
                background: '#f8f5ee',
                borderRadius: 16,
                padding: '16px',
                border: '1px solid #e7ded0',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#2e5239',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>🎯</span>
                <span>Mục tiêu tuần này</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: '#595959' }}>
                Hoàn thành 100% các tiết học đúng giờ. Nộp học phí trước ngày hết hạn và hoàn thành
                bài tập lập trình di động & kỹ thuật phần mềm.
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
