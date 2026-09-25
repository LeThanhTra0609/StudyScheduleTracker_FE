import { useEffect, useState } from 'react';
import {
  Table, Button, Space, Input, Select, Typography, App, Tag,
  Modal, Radio, Divider, Tooltip, Popconfirm, Badge,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  ExclamationCircleOutlined, SyncOutlined, CalendarOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { scheduleApi } from '../../api/schedule.api';
import { StatusBadge, TypeBadge } from '../../components/common/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import type { Schedule } from '../../types';

const { Text } = Typography;

type DeleteMode = 'single' | 'series';

const TODAY = dayjs().startOf('day');

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('single');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletePastLoading, setDeletePastLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await scheduleApi.getAll({ type: filterType, status: filterStatus });
      setSchedules(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, [filterType, filterStatus, location.key]);

  const openDeleteModal = (schedule: Schedule) => {
    setDeleteMode('single');
    setDeleteTarget(schedule);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteMode === 'series' && deleteTarget.recurringGroupId) {
        await scheduleApi.deleteRecurringSeries(deleteTarget.recurringGroupId);
        message.success('Đã xóa toàn bộ chuỗi lịch lặp');
      } else {
        await scheduleApi.delete(deleteTarget._id);
        message.success('Đã xóa buổi học');
      }
      setDeleteTarget(null);
      fetchSchedules();
    } catch {
      message.error('Xóa thất bại, vui lòng thử lại');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeletePast = async () => {
    setDeletePastLoading(true);
    try {
      const res = await scheduleApi.deletePast();
      const count = res.data.deletedCount ?? 0;
      message.success(`Đã dọn ${count} lịch học quá khứ`);
      fetchSchedules();
    } catch {
      message.error('Không thể dọn lịch cũ, vui lòng thử lại');
    } finally {
      setDeletePastLoading(false);
    }
  };

  // Sort: closest to today first (today & future asc, past desc after)
  const sortedSchedules = [...schedules].sort((a, b) => {
    const da = dayjs(a.date);
    const db = dayjs(b.date);
    const diffA = Math.abs(da.diff(TODAY, 'day'));
    const diffB = Math.abs(db.diff(TODAY, 'day'));
    if (diffA !== diffB) return diffA - diffB;
    // same distance: future before past
    const aFuture = da.isSame(TODAY) || da.isAfter(TODAY);
    const bFuture = db.isSame(TODAY) || db.isAfter(TODAY);
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;
    return 0;
  });

  const filtered = sortedSchedules.filter(s => {
    const subjectName = typeof s.subjectId === 'object' ? s.subjectId.name : '';
    return subjectName.toLowerCase().includes(search.toLowerCase());
  });

  const columns = [
    {
      title: 'Môn học',
      key: 'subject',
      render: (_: unknown, s: Schedule) => {
        const sub = typeof s.subjectId === 'object' ? s.subjectId : null;
        return sub ? (
          <Space>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: sub.color, display: 'inline-block', flexShrink: 0,
            }} />
            <Text strong style={{ fontSize: 13 }}>{sub.name}</Text>
          </Space>
        ) : '-';
      },
    },
    {
      title: 'Loại',
      key: 'type',
      render: (_: unknown, s: Schedule) => <TypeBadge type={s.type} />,
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (d: string) => {
        const date = dayjs(d);
        const isToday = date.isSame(TODAY, 'day');
        const isTomorrow = date.isSame(TODAY.add(1, 'day'), 'day');
        const isPast = date.isBefore(TODAY, 'day');
        return (
          <Space size={4}>
            {isToday && <Badge status="processing" color="#2e5239" />}
            <span style={{ color: isPast ? '#aaa' : isToday ? '#2e5239' : undefined, fontWeight: isToday ? 700 : undefined }}>
              {date.format('DD/MM/YYYY')}
            </span>
            {isToday && <Tag color="green" style={{ borderRadius: 20, fontSize: 11, padding: '0 8px', marginLeft: 2 }}>Hôm nay</Tag>}
            {isTomorrow && <Tag color="blue" style={{ borderRadius: 20, fontSize: 11, padding: '0 8px', marginLeft: 2 }}>Ngày mai</Tag>}
            {isPast && <Tag color="default" style={{ borderRadius: 20, fontSize: 11, padding: '0 8px', marginLeft: 2, color: '#aaa' }}>Đã qua</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_: unknown, s: Schedule) => `${s.startTime} – ${s.endTime}`,
    },
    {
      title: 'Địa điểm',
      key: 'location',
      render: (_: unknown, s: Schedule) =>
        typeof s.locationId === 'object' ? s.locationId?.name : '-',
    },
    {
      title: 'Lặp lại',
      key: 'recurring',
      render: (_: unknown, s: Schedule) =>
        s.isRecurring ? (
          <Tag icon={<SyncOutlined />} color="purple" style={{ borderRadius: 20, fontSize: 12 }}>
            Lặp lại
          </Tag>
        ) : (
          <Tag color="default" style={{ borderRadius: 20, fontSize: 12 }}>Một lần</Tag>
        ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, s: Schedule) => <StatusBadge status={s.status} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right' as const,
      width: 100,
      render: (_: unknown, s: Schedule) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            title="Chỉnh sửa"
            onClick={() => navigate(`/schedules/${s._id}/edit`)}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            title="Xóa lịch học"
            onClick={() => openDeleteModal(s)}
          />
        </Space>
      ),
    },
  ];

  /* ─── Delete modal ─── */
  const isRecurringSched = deleteTarget?.isRecurring && !!deleteTarget?.recurringGroupId;
  const subjectName = deleteTarget
    ? (typeof deleteTarget.subjectId === 'object' ? deleteTarget.subjectId.name : 'Môn học')
    : '';

  // Count past schedules for the button label
  const pastCount = schedules.filter(s => dayjs(s.date).isBefore(TODAY, 'day')).length;

  return (
    <div>
      <PageHeader
        title="Lịch học của tôi"
        icon="🗓️"
        subtitle="Quản lý toàn bộ danh sách các buổi học, tìm kiếm và lọc theo trạng thái"
        extra={
          <Space wrap>
            {pastCount > 0 && (
              <Tooltip title={`Xóa ${pastCount} lịch học đã qua (trước hôm nay)`}>
                <Popconfirm
                  title="Dọn lịch học quá khứ"
                  description={`Bạn có chắc muốn xóa ${pastCount} lịch học đã qua? Thao tác này không thể hoàn tác.`}
                  onConfirm={handleDeletePast}
                  okText="Xóa hết"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    icon={<ClearOutlined />}
                    loading={deletePastLoading}
                    style={{
                      borderRadius: 10,
                      borderColor: '#ff7875',
                      color: '#ff4d4f',
                      fontWeight: 600,
                    }}
                  >
                    Dọn lịch cũ ({pastCount})
                  </Button>
                </Popconfirm>
              </Tooltip>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/schedules/new')}
              style={{
                background: '#2e5239',
                borderColor: '#2e5239',
                borderRadius: 10,
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(46, 82, 57, 0.2)',
              }}
            >
              Thêm lịch học
            </Button>
          </Space>
        }
      />

      {/* ── SEARCH & FILTER ── */}
      <div className="cozy-filter-card">
        <Input
          prefix={<SearchOutlined style={{ color: '#2e5239' }} />}
          placeholder="Tìm kiếm theo tên môn học..."
          value={search}
          allowClear
          onChange={e => setSearch(e.target.value)}
          className="cozy-search-input"
          style={{ flex: '2 1 240px', minWidth: 200 }}
        />
        <Select
          placeholder="Tất cả loại lịch"
          allowClear
          value={filterType}
          style={{ flex: '1 1 140px', minWidth: 140 }}
          onChange={setFilterType}
          options={[
            { value: 'ACADEMIC', label: '📘 Chính khóa' },
            { value: 'EXTRA_CLASS', label: '📙 Học thêm' },
          ]}
        />
        <Select
          placeholder="Tất cả trạng thái"
          allowClear
          value={filterStatus}
          style={{ flex: '1 1 150px', minWidth: 150 }}
          onChange={setFilterStatus}
          options={[
            { value: 'UPCOMING', label: '⏳ Sắp diễn ra' },
            { value: 'COMPLETED', label: '✅ Đã hoàn thành' },
            { value: 'ABSENT', label: '❌ Vắng mặt' },
            { value: 'CANCELLED', label: '⚫ Đã hủy' },
          ]}
        />
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6e7f72', fontWeight: 600 }}>
          Hiển thị <strong style={{ color: '#2e5239' }}>{filtered.length}</strong> / {schedules.length} lịch học
        </div>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="_id"
        loading={loading}
        scroll={{ x: 850 }}
        rowClassName={(s: Schedule) =>
          dayjs(s.date).isSame(TODAY, 'day') ? 'schedule-row-today' : ''
        }
      />

      {/* ── SMART DELETE MODAL ── */}
      <Modal
        open={!!deleteTarget}
        onCancel={() => !deleteLoading && setDeleteTarget(null)}
        onOk={handleConfirmDelete}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: deleteLoading, icon: <DeleteOutlined /> }}
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
            <span style={{ fontWeight: 700 }}>Xác nhận xóa lịch học</span>
          </Space>
        }
        width={480}
        centered
        destroyOnClose
      >
        {deleteTarget && (
          <>
            {/* Info card */}
            <div style={{
              background: 'linear-gradient(135deg, #fff1f0, #fff7e6)',
              border: '1px solid #ffa39e',
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 16,
            }}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space>
                  <CalendarOutlined style={{ color: '#ff4d4f' }} />
                  <Text strong style={{ fontSize: 15 }}>{subjectName}</Text>
                  {isRecurringSched && (
                    <Tag color="purple" style={{ borderRadius: 10, fontSize: 11 }}>
                      <SyncOutlined /> Lặp lại
                    </Tag>
                  )}
                </Space>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  📅 {dayjs(deleteTarget.date).format('dddd, DD/MM/YYYY')}
                  &nbsp;|&nbsp;
                  ⏱ {deleteTarget.startTime} – {deleteTarget.endTime}
                </Text>
              </Space>
            </div>

            {/* Recurring: show choice */}
            {isRecurringSched ? (
              <>
                <Text style={{ fontSize: 13, color: '#595959', display: 'block', marginBottom: 12 }}>
                  Đây là <strong>lịch lặp lại</strong>. Bạn muốn xóa:
                </Text>
                <Radio.Group
                  value={deleteMode}
                  onChange={e => setDeleteMode(e.target.value as DeleteMode)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size={10}>
                    <Radio value="single" style={{ width: '100%', alignItems: 'flex-start' }}>
                      <div style={{
                        border: `2px solid ${deleteMode === 'single' ? '#1677ff' : '#e0e0e0'}`,
                        borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: deleteMode === 'single' ? '#f0f5ff' : '#fafafa',
                      }}>
                        <Text strong style={{ display: 'block', fontSize: 13 }}>
                          🗑️ Chỉ xóa buổi này
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Xóa riêng buổi ngày {dayjs(deleteTarget.date).format('DD/MM/YYYY')}, các buổi khác vẫn giữ nguyên.
                        </Text>
                      </div>
                    </Radio>
                    <Radio value="series" style={{ width: '100%', alignItems: 'flex-start' }}>
                      <div style={{
                        border: `2px solid ${deleteMode === 'series' ? '#ff4d4f' : '#e0e0e0'}`,
                        borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: deleteMode === 'series' ? '#fff1f0' : '#fafafa',
                      }}>
                        <Text strong style={{ display: 'block', fontSize: 13, color: '#ff4d4f' }}>
                          🗑️ Xóa toàn bộ chuỗi lặp
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Xóa tất cả các buổi trong chuỗi lịch lặp này (không thể khôi phục).
                        </Text>
                      </div>
                    </Radio>
                  </Space>
                </Radio.Group>

                {deleteMode === 'series' && (
                  <>
                    <Divider style={{ margin: '14px 0 10px' }} />
                    <div style={{
                      background: '#fff1f0', border: '1px solid #ffccc7',
                      borderRadius: 8, padding: '8px 12px',
                    }}>
                      <Text type="danger" style={{ fontSize: 12 }}>
                        ⚠️ <strong>Cảnh báo:</strong> Thao tác này sẽ xóa toàn bộ chuỗi lịch lặp và <strong>không thể hoàn tác</strong>.
                      </Text>
                    </div>
                  </>
                )}
              </>
            ) : (
              <Text style={{ fontSize: 13, color: '#595959' }}>
                Bạn có chắc muốn xóa buổi học này không? Thao tác này <strong>không thể hoàn tác</strong>.
              </Text>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
