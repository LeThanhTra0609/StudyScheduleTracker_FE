import { useEffect, useState } from 'react';
import { Table, Button, Space, Input, Select, Popconfirm, Typography, App, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { scheduleApi } from '../../api/schedule.api';
import { StatusBadge, TypeBadge } from '../../components/common/StatusBadge';
import type { Schedule } from '../../types';

const { Title } = Typography;

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await scheduleApi.getAll({ type: filterType, status: filterStatus });
      setSchedules(res.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSchedules(); }, [filterType, filterStatus]);

  const handleDelete = async (id: string) => {
    try {
      await scheduleApi.delete(id);
      message.success('Đã xóa lịch học');
      fetchSchedules();
    } catch { message.error('Xóa thất bại'); }
  };

  const filtered = schedules.filter(s => {
    const subjectName = typeof s.subjectId === 'object' ? s.subjectId.name : '';
    return subjectName.toLowerCase().includes(search.toLowerCase());
  });

  const columns = [
    {
      title: 'Môn học',
      key: 'subject',
      render: (_: unknown, s: Schedule) => {
        const sub = typeof s.subjectId === 'object' ? s.subjectId : null;
        return sub ? <Space><span style={{ width: 10, height: 10, borderRadius: '50%', background: sub.color, display: 'inline-block' }} />{sub.name}</Space> : '-';
      },
    },
    { title: 'Loại', key: 'type', render: (_: unknown, s: Schedule) => <TypeBadge type={s.type} /> },
    { title: 'Ngày', dataIndex: 'date', key: 'date', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Thời gian', key: 'time', render: (_: unknown, s: Schedule) => `${s.startTime} – ${s.endTime}` },
    {
      title: 'Địa điểm',
      key: 'location',
      render: (_: unknown, s: Schedule) => typeof s.locationId === 'object' ? s.locationId?.name : '-',
    },
    { title: 'Trạng thái', key: 'status', render: (_: unknown, s: Schedule) => <StatusBadge status={s.status} /> },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: unknown, s: Schedule) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => navigate(`/schedules/${s._id}/edit`)} />
          <Popconfirm title="Xóa lịch học này?" onConfirm={() => handleDelete(s._id)} okText="Xóa" cancelText="Hủy">
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%', flexWrap: 'wrap' }}>
        <Title level={4} style={{ margin: 0 }}>📋 Lịch học của tôi</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/schedules/new')}>Thêm lịch</Button>
      </Space>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }} size={8}>
        <Input prefix={<SearchOutlined />} placeholder="Tìm môn học..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
        <Select placeholder="Loại lịch" allowClear style={{ width: 150 }} onChange={setFilterType} options={[{ value: 'ACADEMIC', label: 'Chính khóa' }, { value: 'EXTRA_CLASS', label: 'Học thêm' }]} />
        <Select placeholder="Trạng thái" allowClear style={{ width: 150 }} onChange={setFilterStatus} options={[
          { value: 'UPCOMING', label: 'Sắp diễn ra' },
          { value: 'COMPLETED', label: 'Đã hoàn thành' },
          { value: 'ABSENT', label: 'Vắng mặt' },
          { value: 'CANCELLED', label: 'Đã hủy' },
        ]} />
      </Space>

      <Table dataSource={filtered} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 700 }} />
    </div>
  );
}
