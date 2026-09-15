import { useEffect, useState } from 'react';
import { Table, Tabs, Select, DatePicker, Space, Typography, Modal, Button, Form, Input, App, Badge } from 'antd';
import { SearchOutlined, CheckSquareOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { attendanceApi } from '../../api/payment.api';
import { scheduleApi } from '../../api/schedule.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import type { Attendance, Schedule, ScheduleStatus } from '../../types';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function AttendancePage() {
  const [history, setHistory] = useState<Attendance[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [markModal, setMarkModal] = useState<{ open: boolean; schedule: Schedule | null }>({ open: false, schedule: null });
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [histRes, schedRes] = await Promise.all([
          attendanceApi.getHistory(),
          scheduleApi.getAll(),
        ]);
        setHistory(histRes.data.data);
        setSchedules(schedRes.data.data);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleMark = async (values: { status: ScheduleStatus; notes?: string }) => {
    if (!markModal.schedule) return;
    try {
      await scheduleApi.markAttendance(markModal.schedule._id, values);
      message.success('Đã đánh dấu buổi học');
      setMarkModal({ open: false, schedule: null });
      // Refresh
      const [histRes, schedRes] = await Promise.all([attendanceApi.getHistory(), scheduleApi.getAll()]);
      setHistory(histRes.data.data);
      setSchedules(schedRes.data.data);
    } catch { message.error('Có lỗi xảy ra'); }
  };

  const getSubjectName = (a: Attendance) => {
    const s = a.scheduleId as Schedule;
    return typeof s?.subjectId === 'object' ? s.subjectId.name : '';
  };

  const historyColumns = [
    { title: 'Ngày', dataIndex: 'date', key: 'date', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Môn học', key: 'subject', render: (_: unknown, a: Attendance) => getSubjectName(a) },
    { title: 'Thời lượng', dataIndex: 'durationMinutes', key: 'dur', render: (m: number) => m ? `${(m/60).toFixed(1)} giờ` : '-' },
    { title: 'Trạng thái', key: 'status', render: (_: unknown, a: Attendance) => <StatusBadge status={a.status} /> },
    { title: 'Ghi chú', dataIndex: 'notes', key: 'notes' },
  ];

  const scheduleColumns = [
    { title: 'Môn học', key: 'subject', render: (_: unknown, s: Schedule) => typeof s.subjectId === 'object' ? s.subjectId.name : '' },
    { title: 'Ngày', dataIndex: 'date', key: 'date', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Giờ', key: 'time', render: (_: unknown, s: Schedule) => `${s.startTime} – ${s.endTime}` },
    { title: 'Trạng thái', key: 'status', render: (_: unknown, s: Schedule) => <StatusBadge status={s.status} /> },
    {
      title: 'Đánh dấu',
      key: 'mark',
      render: (_: unknown, s: Schedule) => (
        <Button size="small" type="primary" onClick={() => { setMarkModal({ open: true, schedule: s }); form.resetFields(); }}>
          Đánh dấu
        </Button>
      ),
    },
  ];

  const filteredSchedules = schedules.filter(s => {
    const sub = typeof s.subjectId === 'object' ? s.subjectId?.name : '';
    return (sub || '').toLowerCase().includes(search.toLowerCase());
  });

  const filteredHistory = history.filter(a => {
    const sub = getSubjectName(a);
    const notes = a.notes || '';
    return sub.toLowerCase().includes(search.toLowerCase()) || notes.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <PageHeader
        title="Điểm danh buổi học"
        icon="✍️"
        subtitle="Ghi nhận trạng thái tham gia, theo dõi lịch sử chuyên cần và buổi vắng"
      />

      {/* ── SEARCH & FILTER WHITE CARD ── */}
      <div className="cozy-filter-card">
        <Input
          prefix={<SearchOutlined style={{ color: '#2e5239' }} />}
          placeholder="Tìm kiếm theo tên môn học hoặc ghi chú..."
          value={search}
          allowClear
          onChange={e => setSearch(e.target.value)}
          className="cozy-search-input"
          style={{ flex: '1 1 300px', maxWidth: 450 }}
        />
      </div>

      <Tabs
        items={[
          {
            key: 'mark',
            label: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckSquareOutlined />
                Đánh dấu buổi học
                <Badge count={filteredSchedules.length} style={{ backgroundColor: '#2e5239' }} />
              </span>
            ),
            children: <Table dataSource={filteredSchedules} columns={scheduleColumns} rowKey="_id" loading={loading} scroll={{ x: 600 }} />,
          },
          {
            key: 'history',
            label: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <HistoryOutlined />
                Lịch sử điểm danh
                <Badge count={filteredHistory.length} style={{ backgroundColor: '#52825b' }} />
              </span>
            ),
            children: <Table dataSource={filteredHistory} columns={historyColumns} rowKey="_id" loading={loading} scroll={{ x: 600 }} />,
          },
        ]}
      />

      <Modal
        title="Đánh dấu trạng thái buổi học"
        open={markModal.open}
        onCancel={() => setMarkModal({ open: false, schedule: null })}
        onOk={() => form.submit()}
        okText="Xác nhận"
      >
        {markModal.schedule && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            {typeof markModal.schedule.subjectId === 'object' ? markModal.schedule.subjectId.name : ''} – {dayjs(markModal.schedule.date).format('DD/MM/YYYY')} · {markModal.schedule.startTime}–{markModal.schedule.endTime}
          </Text>
        )}
        <Form form={form} layout="vertical" onFinish={handleMark}>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select options={[
              { value: 'COMPLETED', label: '✅ Đã hoàn thành' },
              { value: 'ABSENT', label: '❌ Vắng mặt' },
              { value: 'EXCUSED', label: '🟡 Vắng có phép' },
              { value: 'CANCELLED', label: '⚫ Đã hủy' },
            ]} />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
