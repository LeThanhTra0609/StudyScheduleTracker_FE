import { useEffect, useState } from 'react';
import { Row, Col, Typography, Spin, Button, Tag, Alert, Progress, Divider } from 'antd';
import {
  CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, RightOutlined,
  BookOutlined, EnvironmentOutlined, CreditCardOutlined, PlusOutlined,
  FireOutlined, TrophyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { scheduleApi } from '../../api/schedule.api';
import { paymentApi, statsApi } from '../../api/payment.api';
import { subjectApi } from '../../api/subject.api';
import { locationApi } from '../../api/location.api';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge, TypeBadge } from '../../components/common/StatusBadge';
import type { Schedule, PaymentSummary, StudyStats, Subject, Location } from '../../types';

dayjs.locale('vi');

const { Title, Text } = Typography;

// ─── helpers ────────────────────────────────────────────────────────────────
const subjectName = (s: Schedule) =>
  typeof s.subjectId === 'object' && s.subjectId ? s.subjectId.name : '';
const subjectColor = (s: Schedule) =>
  typeof s.subjectId === 'object' && s.subjectId?.color ? s.subjectId.color : '#1677ff';
const locationName = (s: Schedule) =>
  typeof s.locationId === 'object' && s.locationId ? s.locationId.name : '';

// ─── mini stat card ──────────────────────────────────────────────────────────
function StatPill({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string | number; accent?: string;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14,
      padding: '18px 14px', flex: 1, minWidth: 90,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: 20, marginBottom: 6, color: accent || '#1677ff' }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent || '#111', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4, textAlign: 'center', lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

// ─── section header ──────────────────────────────────────────────────────────
function SectionHeader({ title, action, onAction }: {
  title: string; action?: string; onAction?: () => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <Text strong style={{ fontSize: 14, color: '#111' }}>{title}</Text>
      {action && (
        <Button type="link" size="small" onClick={onAction} style={{ padding: 0, fontSize: 12 }}>
          {action} <RightOutlined style={{ fontSize: 10 }} />
        </Button>
      )}
    </div>
  );
}

// ─── schedule row ─────────────────────────────────────────────────────────────
function ScheduleRow({ s, onClick }: { s: Schedule; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 10,
        background: '#fafafa', border: '1px solid #f0f0f0',
        cursor: 'pointer', transition: 'background 0.15s',
        borderLeft: `3px solid ${subjectColor(s)}`,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
      onMouseLeave={e => (e.currentTarget.style.background = '#fafafa')}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#111', marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {subjectName(s)}
        </div>
        <div style={{ fontSize: 11, color: '#8c8c8c', display: 'flex', gap: 8 }}>
          <span><ClockCircleOutlined style={{ marginRight: 3 }} />{s.startTime} – {s.endTime}</span>
          {locationName(s) && <span><EnvironmentOutlined style={{ marginRight: 3 }} />{locationName(s)}</span>}
        </div>
      </div>
      <StatusBadge status={s.status} />
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [upcoming, setUpcoming] = useState<Schedule[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(dayjs());

  const { user, selectedChildId } = useAuthStore();
  const navigate = useNavigate();

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 30000);
    return () => clearInterval(t);
  }, []);

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
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#8c8c8c', fontSize: 14 }}>Đang tải dữ liệu...</div>
      </div>
    );
  }

  const completedToday = todaySchedules.filter(s => s.status === 'COMPLETED').length;
  const todayProgress = todaySchedules.length > 0
    ? Math.round((completedToday / todaySchedules.length) * 100) : 0;
  const totalHours = Math.round((studyStats?.totalMinutes ?? 0) / 60);
  const paidPercent = paymentSummary && paymentSummary.totalAmount > 0
    ? Math.round((paymentSummary.paidAmount / paymentSummary.totalAmount) * 100) : 100;
  const nextSession = todaySchedules.find(s => s.status === 'UPCOMING') || upcoming[0];
  const greetHour = now.hour();
  const greeting = greetHour < 12 ? 'Chào buổi sáng' : greetHour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', paddingBottom: 40 }}>

      {/* ── HEADER BAR ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 28, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 2 }}>
            {now.format('dddd, DD/MM/YYYY')} · {now.format('HH:mm')}
          </div>
          <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#111' }}>
            {greeting}{user?.name ? ', ' + user.name.split(' ').pop() : ''}! 👋
          </Title>
        </div>
        <Button
          type="primary" icon={<PlusOutlined />} size="large"
          onClick={() => navigate('/schedules/new')}
          style={{ borderRadius: 10, fontWeight: 600 }}
        >
          Thêm lịch học
        </Button>
      </div>

      {/* ── PAYMENT ALERT ──────────────────────────────────────────────────── */}
      {paymentSummary && ((paymentSummary.overdueCount ?? 0) > 0 || (paymentSummary.dueSoonCount ?? 0) > 0) && (
        <Alert
          type={(paymentSummary.overdueCount ?? 0) > 0 ? 'error' : 'warning'}
          showIcon
          message={
            (paymentSummary.overdueCount ?? 0) > 0
              ? `${paymentSummary.overdueCount} khoản học phí đã quá hạn`
              : `${paymentSummary.dueSoonCount} khoản học phí sắp đến hạn trong 7 ngày tới`
          }
          action={
            <Button size="small" onClick={() => navigate('/payments')} danger={(paymentSummary.overdueCount ?? 0) > 0}>
              Xem ngay
            </Button>
          }
          style={{ marginBottom: 20, borderRadius: 10 }}
          closable
        />
      )}

      {/* ── STAT PILLS ROW ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatPill icon={<CalendarOutlined />} label="Lịch hôm nay" value={todaySchedules.length} accent="#1677ff" />
        <StatPill icon={<CheckCircleOutlined />} label="Đã hoàn thành" value={studyStats?.completed ?? 0} accent="#52c41a" />
        <StatPill icon={<ClockCircleOutlined />} label="Tổng giờ học" value={totalHours + 'h'} accent="#722ed1" />
        <StatPill icon={<FireOutlined />} label="Buổi vắng" value={studyStats?.absent ?? 0} accent="#ff4d4f" />
        <StatPill icon={<TrophyOutlined />} label="Môn học" value={subjects.length} accent="#fa8c16" />
        <StatPill icon={<BookOutlined />} label="Địa điểm" value={locations.length} accent="#13c2c2" />
      </div>

      <Row gutter={[20, 20]}>
        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <Col xs={24} lg={16}>

          {/* Today's schedule */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: '20px 22px',
            border: '1px solid #f0f0f0', marginBottom: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <SectionHeader
              title={`📅 Lịch học hôm nay (${todaySchedules.length})`}
              action="Xem lịch"
              onAction={() => navigate('/calendar')}
            />

            {/* Progress */}
            {todaySchedules.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>
                  <span>Tiến độ hôm nay</span>
                  <span style={{ fontWeight: 600, color: '#52c41a' }}>{completedToday}/{todaySchedules.length} buổi</span>
                </div>
                <Progress
                  percent={todayProgress}
                  strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }}
                  trailColor="#f0f0f0"
                  strokeWidth={6}
                  showInfo={false}
                />
              </div>
            )}

            {todaySchedules.length === 0 ? (
              <div style={{
                padding: '32px 0', textAlign: 'center', color: '#8c8c8c',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 600, color: '#444', marginBottom: 4 }}>Không có lịch học hôm nay</div>
                <div style={{ fontSize: 13 }}>Hãy nghỉ ngơi và nạp năng lượng!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todaySchedules.map(s => (
                  <ScheduleRow key={s._id} s={s} onClick={() => navigate('/calendar')} />
                ))}
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <Button
                block onClick={() => navigate('/attendance')}
                style={{ borderRadius: 8, fontWeight: 600 }}
                icon={<CheckCircleOutlined />}
              >
                Điểm danh buổi học
              </Button>
            </div>
          </div>

          {/* Upcoming */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: '20px 22px',
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <SectionHeader
              title="⏭️ Buổi học sắp tới"
              action="Xem tất cả"
              onAction={() => navigate('/schedules')}
            />
            {upcoming.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#8c8c8c', fontSize: 13 }}>
                Không có lịch học sắp tới
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.slice(0, 5).map(s => (
                  <div key={s._id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10,
                    background: '#fafafa', border: '1px solid #f0f0f0',
                    borderLeft: `3px solid ${subjectColor(s)}`,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#111', marginBottom: 1 }}>
                        {subjectName(s)}
                      </div>
                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                        {dayjs(s.date).format('ddd, DD/MM')} · {s.startTime} – {s.endTime}
                        {locationName(s) && ` · ${locationName(s)}`}
                      </div>
                    </div>
                    <TypeBadge type={s.type} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
        <Col xs={24} lg={8}>

          {/* Next session highlight */}
          {nextSession && (
            <div style={{
              background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
              borderRadius: 16, padding: '20px 22px', marginBottom: 20,
              color: '#fff', boxShadow: '0 4px 20px rgba(22,119,255,0.3)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, marginBottom: 8, letterSpacing: 1 }}>
                BUỔI HỌC KẾ TIẾP
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, lineHeight: 1.2 }}>
                {subjectName(nextSession)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, opacity: 0.9 }}>
                <span>📅 {dayjs(nextSession.date).format('dddd, DD/MM/YYYY')}</span>
                <span>🕒 {nextSession.startTime} – {nextSession.endTime}</span>
                {locationName(nextSession) && <span>📍 {locationName(nextSession)}</span>}
                {nextSession.teacher && <span>👨‍🏫 {nextSession.teacher}</span>}
              </div>
              <div style={{ marginTop: 14 }}>
                <Tag style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  color: '#fff', borderRadius: 8, fontWeight: 600,
                }}>
                  <TypeBadge type={nextSession.type} />
                </Tag>
              </div>
            </div>
          )}

          {/* Payment summary */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: '20px 22px',
            border: '1px solid #f0f0f0', marginBottom: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <SectionHeader
              title="💳 Học phí"
              action="Chi tiết"
              onAction={() => navigate('/payments')}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>Tổng học phí</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>
                  {(paymentSummary?.totalAmount ?? 0).toLocaleString('vi-VN')}đ
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>Còn nợ</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: (paymentSummary?.remainingAmount ?? 0) > 0 ? '#ff4d4f' : '#52c41a' }}>
                  {(paymentSummary?.remainingAmount ?? 0).toLocaleString('vi-VN')}đ
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>Đã thanh toán</span>
              <span style={{ fontWeight: 700, color: '#52c41a' }}>{paidPercent}%</span>
            </div>
            <Progress
              percent={paidPercent}
              strokeColor="#52c41a"
              trailColor="#f5f5f5"
              strokeWidth={8}
              showInfo={false}
            />
            <Button
              block icon={<CreditCardOutlined />} onClick={() => navigate('/payments')}
              style={{ marginTop: 14, borderRadius: 8, fontWeight: 600 }}
            >
              Quản lý học phí
            </Button>
          </div>

          {/* Subjects list */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: '20px 22px',
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <SectionHeader
              title={`📚 Môn học (${subjects.length})`}
              action="Quản lý"
              onAction={() => navigate('/subjects')}
            />
            {subjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#8c8c8c', fontSize: 13 }}>
                Chưa có môn học nào
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {subjects.map(sub => (
                  <div key={sub._id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 20,
                    border: `1px solid ${sub.color || '#d9d9d9'}40`,
                    background: `${sub.color || '#1677ff'}12`,
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: sub.color || '#1677ff', flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{sub.name}</span>
                  </div>
                ))}
              </div>
            )}
            <Button
              block onClick={() => navigate('/subjects')} icon={<PlusOutlined />}
              style={{ marginTop: 12, borderRadius: 8, fontWeight: 600 }}
            >
              Thêm môn học
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
}
