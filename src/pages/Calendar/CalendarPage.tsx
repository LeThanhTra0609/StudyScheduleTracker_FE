import { useEffect, useState } from 'react';
import {
  Calendar,
  Badge,
  Tabs,
  List,
  DatePicker,
  Typography,
  Space,
  Card,
  Spin,
  Button,
  Tag,
  Modal,
  Descriptions,
  Segmented,
  Tooltip,
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  LinkOutlined,
  VideoCameraOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { scheduleApi } from '../../api/schedule.api';
import { StatusBadge, TypeBadge } from '../../components/common/StatusBadge';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { Schedule } from '../../types';

dayjs.extend(isoWeek);

const { Title, Text } = Typography;

const VIETNAMESE_DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
const VIETNAMESE_DAYS_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function CalendarPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [activeTab, setActiveTab] = useState<string>('weekly');
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [mobileDayFilter, setMobileDayFilter] = useState<string>('all');
  const [loadedMonth, setLoadedMonth] = useState<string>('');

  const isMobile = useMediaQuery('(max-width: 768px)');
  const navigate = useNavigate();

  // Fetch schedules covering current month plus buffer weeks
  const fetchSchedulesForDate = async (targetDate: Dayjs, force = false) => {
    const monthKey = targetDate.format('YYYY-MM');
    if (!force && monthKey === loadedMonth && schedules.length > 0) {
      return;
    }

    setLoading(true);
    try {
      const start = targetDate.startOf('month').subtract(14, 'day');
      const end = targetDate.endOf('month').add(14, 'day');
      const res = await scheduleApi.getAll({
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD'),
      });
      setSchedules(res.data.data);
      setLoadedMonth(monthKey);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedulesForDate(selectedDate, true);
  }, []);

  const handleDateChange = (date: Dayjs) => {
    setSelectedDate(date);
    fetchSchedulesForDate(date);
  };

  // Week navigation
  const weekStart = selectedDate.startOf('isoWeek');
  const weekEnd = selectedDate.endOf('isoWeek');
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));

  const handlePrevWeek = () => {
    const prev = selectedDate.subtract(1, 'week');
    handleDateChange(prev);
  };

  const handleNextWeek = () => {
    const next = selectedDate.add(1, 'week');
    handleDateChange(next);
  };

  const handleCurrentWeek = () => {
    const now = dayjs();
    handleDateChange(now);
  };

  // Helpers
  const getDaySchedules = (date: Dayjs) =>
    schedules.filter((s) => dayjs(s.date).isSame(date, 'day'));

  const getSubjectName = (s: Schedule) =>
    typeof s.subjectId === 'object' && s.subjectId ? s.subjectId.name : '';
  const getSubjectColor = (s: Schedule) =>
    typeof s.subjectId === 'object' && s.subjectId?.color ? s.subjectId.color : '#1677ff';
  const getLocationName = (s: Schedule) =>
    typeof s.locationId === 'object' && s.locationId ? s.locationId.name : '';
  const getLocationAddress = (s: Schedule) =>
    typeof s.locationId === 'object' && s.locationId?.address ? s.locationId.address : '';
  const getLocationMapLink = (s: Schedule) =>
    typeof s.locationId === 'object' && s.locationId?.mapLink ? s.locationId.mapLink : '';
  const getLocationMeetingLink = (s: Schedule) =>
    typeof s.locationId === 'object' && s.locationId?.meetingLink ? s.locationId.meetingLink : '';

  // Schedules for current day & current week
  const dailySchedules = getDaySchedules(selectedDate).sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  const weekSchedules = schedules.filter((s) => {
    const d = dayjs(s.date);
    return (
      (d.isSame(weekStart, 'day') || d.isAfter(weekStart, 'day')) &&
      (d.isSame(weekEnd, 'day') || d.isBefore(weekEnd, 'day'))
    );
  });

  const academicCount = weekSchedules.filter((s) => s.type === 'ACADEMIC').length;
  const extraCount = weekSchedules.filter((s) => s.type === 'EXTRA_CLASS').length;

  return (
    <div>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Lịch học
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/schedules/new')}
          style={{
            background: 'linear-gradient(135deg, #2e5239 0%, #44714f 100%)',
            borderColor: '#2e5239',
            borderRadius: 20,
            fontWeight: 700,
          }}
        >
          Thêm lịch học
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          // ─── TAB 1: NGÀY ─────────────────────────────────────────
          {
            key: 'daily',
            label: (
              <span>
                <CalendarOutlined style={{ marginRight: 6 }} />
                Ngày
              </span>
            ),
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    background: '#fdfcf9',
                    padding: '12px 18px',
                    borderRadius: 16,
                    border: '1px solid #e7ded0',
                    boxShadow: '0 2px 8px rgba(40, 60, 44, 0.03)',
                  }}
                >
                  <Button.Group>
                    <Button
                      icon={<LeftOutlined />}
                      onClick={() => handleDateChange(selectedDate.subtract(1, 'day'))}
                    >
                      Hôm trước
                    </Button>
                    <Button onClick={() => handleDateChange(dayjs())}>Hôm nay</Button>
                    <Button
                      icon={<RightOutlined />}
                      onClick={() => handleDateChange(selectedDate.add(1, 'day'))}
                    >
                      Hôm sau
                    </Button>
                  </Button.Group>
                  <DatePicker
                    value={selectedDate}
                    onChange={(d) => d && handleDateChange(d)}
                    format="DD/MM/YYYY"
                    style={{ width: isMobile ? '100%' : 180 }}
                  />
                  <Text strong style={{ fontSize: 15 }}>
                    {selectedDate.format('dddd, DD/MM/YYYY')}
                  </Text>
                  {selectedDate.isSame(dayjs(), 'day') && <Tag color="gold">Hôm nay</Tag>}
                </div>

                {loading ? (
                  <Spin style={{ display: 'block', margin: '40px auto' }} />
                ) : dailySchedules.length === 0 ? (
                  <Card style={{ textAlign: 'center', padding: '40px 20px', background: '#fafafa' }}>
                    <Text type="secondary" style={{ fontSize: 15 }}>
                      Không có lịch học nào vào ngày này 😊
                    </Text>
                  </Card>
                ) : (
                  <List
                    dataSource={dailySchedules}
                    renderItem={(s) => (
                      <List.Item
                        onClick={() => setSelectedSchedule(s)}
                        actions={[<StatusBadge status={s.status} />]}
                        style={{
                          borderLeft: `5px solid ${getSubjectColor(s)}`,
                          padding: '12px 16px',
                          marginBottom: 10,
                          background: '#fff',
                          borderRadius: 8,
                          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <List.Item.Meta
                          title={
                            <Space wrap>
                              <Text strong style={{ fontSize: 15 }}>
                                {getSubjectName(s)}
                              </Text>
                              <TypeBadge type={s.type} />
                              {s.learningMethod === 'ONLINE' && (
                                <Tag color="cyan" icon={<VideoCameraOutlined />}>
                                  Online
                                </Tag>
                              )}
                            </Space>
                          }
                          description={
                            <Space direction="vertical" size={2} style={{ marginTop: 4 }}>
                              <Text type="secondary">
                                <ClockCircleOutlined style={{ marginRight: 6 }} />
                                {s.startTime} – {s.endTime}
                              </Text>
                              {getLocationName(s) && (
                                <Text type="secondary">
                                  <EnvironmentOutlined style={{ marginRight: 6 }} />
                                  {getLocationName(s)}
                                </Text>
                              )}
                              {s.teacher && (
                                <Text type="secondary">
                                  <UserOutlined style={{ marginRight: 6 }} />
                                  {s.teacher}
                                </Text>
                              )}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Space>
            ),
          },

          // ─── TAB 2: TUẦN ─────────────────────────────────────────
          {
            key: 'weekly',
            label: (
              <span>
                <ScheduleOutlined style={{ marginRight: 6 }} />
                Tuần
              </span>
            ),
            children: (
              <div>
                {/* Weekly control bar */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '14px 18px',
                    background: '#fdfcf9',
                    borderRadius: 18,
                    border: '1px solid #e7ded0',
                    boxShadow: '0 2px 8px rgba(40, 60, 44, 0.03)',
                    marginBottom: 16,
                  }}
                >
                  <Space wrap align="center">
                    <Button.Group>
                      <Button icon={<LeftOutlined />} onClick={handlePrevWeek}>
                        Tuần trước
                      </Button>
                      <Button onClick={handleCurrentWeek}>Hôm nay</Button>
                      <Button icon={<RightOutlined />} onClick={handleNextWeek}>
                        Tuần sau
                      </Button>
                    </Button.Group>
                    <DatePicker
                      value={selectedDate}
                      onChange={(d) => d && handleDateChange(d)}
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày"
                      style={{ width: 140 }}
                    />
                  </Space>

                  <Space wrap align="center">
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1f1f1f' }}>
                      Tuần {weekStart.isoWeek()} • {weekStart.format('DD/MM')} –{' '}
                      {weekEnd.format('DD/MM/YYYY')}
                    </div>
                    <Tag color="blue" style={{ fontSize: 12, padding: '2px 8px' }}>
                      Tổng {weekSchedules.length} buổi
                    </Tag>
                    {academicCount > 0 && (
                      <Tag color="geekblue" style={{ fontSize: 12 }}>
                        {academicCount} chính khóa
                      </Tag>
                    )}
                    {extraCount > 0 && (
                      <Tag color="purple" style={{ fontSize: 12 }}>
                        {extraCount} học thêm
                      </Tag>
                    )}
                  </Space>
                </div>

                {/* Mobile Day Selector Tabs */}
                {isMobile && (
                  <div style={{ marginBottom: 12 }}>
                    <Segmented
                      block
                      value={mobileDayFilter}
                      onChange={(val) => setMobileDayFilter(String(val))}
                      options={[
                        { label: 'Cả tuần', value: 'all' },
                        ...weekDays.map((day, idx) => {
                          const dayCount = getDaySchedules(day).length;
                          return {
                            label: (
                              <div style={{ padding: '2px 0', fontSize: 12 }}>
                                <div>{VIETNAMESE_DAYS_SHORT[idx]}</div>
                                <div style={{ fontSize: 10, color: '#8c8c8c' }}>
                                  {day.format('DD/MM')}
                                </div>
                                {dayCount > 0 && (
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      backgroundColor: '#52c41a',
                                      marginTop: 2,
                                    }}
                                  />
                                )}
                              </div>
                            ),
                            value: String(idx),
                          };
                        }),
                      ]}
                    />
                  </div>
                )}

                {/* Week 7-Day Grid */}
                {loading ? (
                  <Spin style={{ display: 'block', margin: '48px auto' }} />
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile
                        ? '1fr'
                        : 'repeat(7, minmax(0, 1fr))',
                      gap: 12,
                      alignItems: 'stretch',
                    }}
                  >
                    {weekDays.map((day, idx) => {
                      // On mobile: filter day if not 'all'
                      if (isMobile && mobileDayFilter !== 'all' && mobileDayFilter !== String(idx)) {
                        return null;
                      }

                      const isToday = day.isSame(dayjs(), 'day');
                      const daySchedules = getDaySchedules(day).sort((a, b) =>
                        a.startTime.localeCompare(b.startTime)
                      );

                      return (
                        <div
                          key={day.format('YYYY-MM-DD')}
                          style={{
                            background: isToday ? '#eef5ee' : '#ffffff',
                            borderRadius: 14,
                            border: `1px solid ${isToday ? '#b7d6be' : '#e7ded0'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: isMobile ? 'auto' : 360,
                            boxShadow: isToday
                              ? '0 3px 12px rgba(46, 82, 57, 0.15)'
                              : '0 1px 3px rgba(0,0,0,0.02)',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Column Header */}
                          <div
                            style={{
                              padding: '10px 12px',
                              background: isToday
                                ? 'linear-gradient(135deg, #2e5239 0%, #44714f 100%)'
                                : '#faf7f0',
                              color: isToday ? '#ffffff' : '#262626',
                              borderBottom: `1px solid ${isToday ? '#2e5239' : '#ece4d8'}`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: 13,
                                  color: isToday ? '#ffffff' : '#1f1f1f',
                                }}
                              >
                                {VIETNAMESE_DAYS[idx]}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: isToday ? 'rgba(255,255,255,0.85)' : '#8c8c8c',
                                }}
                              >
                                {day.format('DD/MM/YYYY')}
                              </div>
                            </div>
                            {isToday ? (
                              <Tag color="gold" style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                                Hôm nay
                              </Tag>
                            ) : daySchedules.length > 0 ? (
                              <Badge
                                count={daySchedules.length}
                                style={{ backgroundColor: '#2e5239' }}
                              />
                            ) : null}
                          </div>

                          {/* Column Body: list of schedules */}
                          <div
                            style={{
                              padding: '10px 8px',
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                            }}
                          >
                            {daySchedules.length === 0 ? (
                              <div
                                style={{
                                  padding: '24px 8px',
                                  textAlign: 'center',
                                  color: '#bfbfbf',
                                  fontSize: 12,
                                  border: '1px dashed #f0f0f0',
                                  borderRadius: 8,
                                  background: isToday ? 'rgba(255,255,255,0.6)' : '#fafafa',
                                }}
                              >
                                Nghỉ học 😊
                              </div>
                            ) : (
                              daySchedules.map((s) => (
                                <div
                                  key={s._id}
                                  onClick={() => setSelectedSchedule(s)}
                                  style={{
                                    padding: '8px 10px',
                                    background: '#ffffff',
                                    borderRadius: 8,
                                    border: '1px solid #f0f0f0',
                                    borderLeft: `4px solid ${getSubjectColor(s)}`,
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow =
                                      '0 4px 12px rgba(0, 0, 0, 0.08)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow =
                                      '0 1px 3px rgba(0, 0, 0, 0.04)';
                                  }}
                                >
                                  {/* Subject Name */}
                                  <Tooltip title={getSubjectName(s)}>
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        fontSize: 12,
                                        color: '#1f1f1f',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        marginBottom: 4,
                                      }}
                                    >
                                      {getSubjectName(s)}
                                    </div>
                                  </Tooltip>

                                  {/* Time */}
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: '#595959',
                                      marginBottom: 4,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    <ClockCircleOutlined
                                      style={{ fontSize: 10, color: '#8c8c8c' }}
                                    />
                                    <span>
                                      {s.startTime} – {s.endTime}
                                    </span>
                                  </div>

                                  {/* Location (if any) */}
                                  {getLocationName(s) && (
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: '#8c8c8c',
                                        marginBottom: 6,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      <EnvironmentOutlined style={{ fontSize: 10 }} />
                                      <span
                                        style={{
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {getLocationName(s)}
                                      </span>
                                    </div>
                                  )}

                                  {/* Badges footer */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: 4,
                                      marginTop: 2,
                                    }}
                                  >
                                    <StatusBadge status={s.status} />
                                    {s.type === 'EXTRA_CLASS' && (
                                      <Tag
                                        color="purple"
                                        style={{
                                          margin: 0,
                                          fontSize: 9,
                                          padding: '0 3px',
                                          lineHeight: '16px',
                                        }}
                                      >
                                        Học thêm
                                      </Tag>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ),
          },

          // ─── TAB 3: THÁNG ────────────────────────────────────────
          {
            key: 'monthly',
            label: (
              <span>
                <AppstoreOutlined style={{ marginRight: 6 }} />
                Tháng
              </span>
            ),
            children: (
              <Card bodyStyle={{ padding: isMobile ? 8 : 24 }}>
                <Calendar
                  fullscreen={!isMobile}
                  value={selectedDate}
                  onSelect={(date) => handleDateChange(date)}
                  onPanelChange={(date) => handleDateChange(date)}
                  cellRender={(date) => {
                    const dayScheds = getDaySchedules(date);
                    return (
                      <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                        {dayScheds.slice(0, 2).map((s) => (
                          <li
                            key={s._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSchedule(s);
                            }}
                            style={{ cursor: 'pointer', marginBottom: 2 }}
                          >
                            <Badge
                              color={getSubjectColor(s)}
                              text={
                                <span style={{ fontSize: 10, fontWeight: 500 }}>
                                  {s.startTime} {getSubjectName(s)}
                                </span>
                              }
                            />
                          </li>
                        ))}
                        {dayScheds.length > 2 && (
                          <li>
                            <Text style={{ fontSize: 10 }} type="secondary">
                              +{dayScheds.length - 2} buổi nữa
                            </Text>
                          </li>
                        )}
                      </ul>
                    );
                  }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Detail Modal for any clicked schedule */}
      <Modal
        title={
          selectedSchedule && (
            <Space align="center">
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: getSubjectColor(selectedSchedule),
                }}
              />
              <span style={{ fontSize: 16, fontWeight: 700 }}>
                {getSubjectName(selectedSchedule)}
              </span>
              <TypeBadge type={selectedSchedule.type} />
            </Space>
          )
        }
        open={!!selectedSchedule}
        onCancel={() => setSelectedSchedule(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedSchedule(null)}>
            Đóng
          </Button>,
          selectedSchedule && (
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                navigate(`/schedules/${selectedSchedule._id}/edit`);
                setSelectedSchedule(null);
              }}
            >
              Chỉnh sửa lịch
            </Button>
          ),
        ]}
      >
        {selectedSchedule && (
          <Descriptions column={1} bordered size="small" style={{ marginTop: 12 }}>
            <Descriptions.Item label="Thời gian">
              <Space wrap>
                <CalendarOutlined style={{ color: '#1677ff' }} />
                <span>{dayjs(selectedSchedule.date).format('dddd, DD/MM/YYYY')}</span>
                <ClockCircleOutlined style={{ marginLeft: 8, color: '#1677ff' }} />
                <span style={{ fontWeight: 600 }}>
                  {selectedSchedule.startTime} – {selectedSchedule.endTime}
                </span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <StatusBadge status={selectedSchedule.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Hình thức học">
              <Tag color={selectedSchedule.learningMethod === 'ONLINE' ? 'cyan' : 'blue'}>
                {selectedSchedule.learningMethod === 'ONLINE'
                  ? 'Trực tuyến (Online)'
                  : 'Trực tiếp (Offline)'}
              </Tag>
            </Descriptions.Item>
            {selectedSchedule.teacher && (
              <Descriptions.Item label="Giảng viên / Giáo viên">
                <Space>
                  <UserOutlined />
                  <span>{selectedSchedule.teacher}</span>
                </Space>
              </Descriptions.Item>
            )}
            {getLocationName(selectedSchedule) && (
              <Descriptions.Item label="Địa điểm">
                <div>
                  <div style={{ fontWeight: 600 }}>{getLocationName(selectedSchedule)}</div>
                  {getLocationAddress(selectedSchedule) && (
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {getLocationAddress(selectedSchedule)}
                    </div>
                  )}
                  {getLocationMapLink(selectedSchedule) && (
                    <Button
                      type="link"
                      size="small"
                      icon={<LinkOutlined />}
                      href={getLocationMapLink(selectedSchedule)}
                      target="_blank"
                      style={{ padding: 0, marginTop: 4 }}
                    >
                      Xem trên Google Maps
                    </Button>
                  )}
                </div>
              </Descriptions.Item>
            )}
            {selectedSchedule.learningMethod === 'ONLINE' &&
              getLocationMeetingLink(selectedSchedule) && (
                <Descriptions.Item label="Phòng học online">
                  <Button
                    type="primary"
                    size="small"
                    icon={<VideoCameraOutlined />}
                    href={getLocationMeetingLink(selectedSchedule)}
                    target="_blank"
                  >
                    Vào phòng học trực tuyến
                  </Button>
                </Descriptions.Item>
              )}
            {selectedSchedule.tuition?.enabled && (
              <Descriptions.Item label="Học phí">
                <Tag color="gold" style={{ fontSize: 12 }}>
                  {selectedSchedule.tuition.paymentMethod === 'PER_SESSION' &&
                    `Theo buổi: ${(selectedSchedule.tuition.pricePerSession || 0).toLocaleString(
                      'vi-VN'
                    )} đ / buổi`}
                  {selectedSchedule.tuition.paymentMethod === 'MONTHLY' &&
                    `Theo tháng: ${(selectedSchedule.tuition.monthlyFee || 0).toLocaleString(
                      'vi-VN'
                    )} đ / tháng`}
                  {selectedSchedule.tuition.paymentMethod === 'COURSE' &&
                    `Theo khóa: ${(selectedSchedule.tuition.courseFee || 0).toLocaleString(
                      'vi-VN'
                    )} đ / khóa`}
                </Tag>
              </Descriptions.Item>
            )}
            {selectedSchedule.notes && (
              <Descriptions.Item label="Ghi chú">
                <Text type="secondary">{selectedSchedule.notes}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
