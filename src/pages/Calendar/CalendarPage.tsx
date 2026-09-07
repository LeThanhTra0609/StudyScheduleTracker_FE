import { useEffect, useState } from 'react';
import { Calendar, Badge, Tabs, List, DatePicker, Typography, Space, Card, Spin } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { scheduleApi } from '../../api/schedule.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { Schedule } from '../../types';

const { Title, Text } = Typography;

export default function CalendarPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const fetchSchedules = async (start: Dayjs, end: Dayjs) => {
    setLoading(true);
    try {
      const res = await scheduleApi.getAll({ startDate: start.format('YYYY-MM-DD'), endDate: end.format('YYYY-MM-DD') });
      setSchedules(res.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchSchedules(selectedDate.startOf('month'), selectedDate.endOf('month'));
  }, []);

  const getDaySchedules = (date: Dayjs) =>
    schedules.filter(s => dayjs(s.date).isSame(date, 'day'));

  const getSubjectName = (s: Schedule) => typeof s.subjectId === 'object' ? s.subjectId.name : '';
  const getSubjectColor = (s: Schedule) => typeof s.subjectId === 'object' ? s.subjectId.color : '#1677ff';

  const dailySchedules = getDaySchedules(selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div>
      <Title level={4}>📅 Lịch học</Title>
      <Tabs
        items={[
          {
            key: 'daily',
            label: 'Ngày',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <DatePicker
                  value={selectedDate}
                  onChange={(d) => {
                    if (d) {
                      setSelectedDate(d);
                      fetchSchedules(d.startOf('month'), d.endOf('month'));
                    }
                  }}
                  format="DD/MM/YYYY"
                  style={{ width: isMobile ? '100%' : 200 }}
                />
                <Title level={5}>{selectedDate.format('dddd, DD/MM/YYYY')}</Title>
                {loading ? <Spin /> : dailySchedules.length === 0 ? (
                  <Text type="secondary">Không có lịch học ngày này 😊</Text>
                ) : (
                  <List
                    dataSource={dailySchedules}
                    renderItem={(s) => (
                      <List.Item
                        actions={[<StatusBadge status={s.status} />]}
                        style={{ borderLeft: `4px solid ${getSubjectColor(s)}`, paddingLeft: 12, marginBottom: 8 }}
                      >
                        <List.Item.Meta
                          title={<Space><Text strong>{getSubjectName(s)}</Text></Space>}
                          description={<Text type="secondary">🕐 {s.startTime} – {s.endTime}</Text>}
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Space>
            ),
          },
          {
            key: 'monthly',
            label: 'Tháng',
            children: (
              <Card bodyStyle={{ padding: isMobile ? 8 : 24 }}>
                <Calendar
                  fullscreen={!isMobile}
                  onSelect={(date) => setSelectedDate(date)}
                  onPanelChange={(date) => fetchSchedules(date.startOf('month'), date.endOf('month'))}
                  cellRender={(date) => {
                    const dayScheds = getDaySchedules(date);
                    return (
                      <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                        {dayScheds.slice(0, 2).map(s => (
                          <li key={s._id}>
                            <Badge color={getSubjectColor(s)} text={<span style={{ fontSize: 10 }}>{getSubjectName(s)}</span>} />
                          </li>
                        ))}
                        {dayScheds.length > 2 && (
                          <li><Text style={{ fontSize: 10 }} type="secondary">+{dayScheds.length - 2} more</Text></li>
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
    </div>
  );
}
