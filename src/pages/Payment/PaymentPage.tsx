import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  App,
  Space,
  Typography,
  Tag,
  Tabs,
  Popconfirm,
  Alert,
  Tooltip,
} from 'antd';
import {
  DollarOutlined,
  CheckOutlined,
  RollbackOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { paymentApi } from '../../api/payment.api';
import { subjectApi } from '../../api/subject.api';
import { PageHeader } from '../../components/common/PageHeader';
import type { Payment, PaymentSummary, Subject } from '../../types';

const { Title, Text, Paragraph } = Typography;

export default function PaymentPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNPAID' | 'URGENT' | 'PAID'>('ALL');

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, subRes] = await Promise.all([
        paymentApi.getAll(),
        paymentApi.getSummary(),
        subjectApi.getAll(),
      ]);
      setPayments(pRes.data.data);
      setSummary(sRes.data.data);
      setSubjects(subRes.data.data);
    } catch {
      message.error('Không thể tải dữ liệu học phí');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick 1-click toggle status
  const handleToggleStatus = async (payment: Payment) => {
    try {
      await paymentApi.toggleStatus(payment._id);
      const isPaidNow = payment.status !== 'PAID';
      message.success(
        isPaidNow
          ? `Đã đánh dấu ĐÃ NỘP cho khoản "${payment.periodLabel}"`
          : `Đã đánh dấu CHƯA NỘP cho khoản "${payment.periodLabel}"`
      );
      loadData();
    } catch {
      message.error('Không thể cập nhật trạng thái');
    }
  };

  // Delete payment
  const handleDelete = async (id: string) => {
    try {
      await paymentApi.delete(id);
      message.success('Đã xóa khoản học phí');
      loadData();
    } catch {
      message.error('Không thể xóa khoản học phí');
    }
  };

  // Open modal create/edit
  const openCreateModal = () => {
    setEditingPayment(null);
    form.resetFields();
    form.setFieldsValue({
      periodLabel: `Học phí Tháng ${dayjs().format('MM/YYYY')}`,
      status: 'UNPAID',
      dueDate: dayjs().add(7, 'day'),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Payment) => {
    setEditingPayment(p);
    const subId =
      typeof p.subjectId === 'object'
        ? p.subjectId?._id
        : (p.subjectId || ((p.scheduleId as any)?.subjectId?._id ?? undefined));

    form.setFieldsValue({
      subjectId: subId,
      periodLabel: p.periodLabel,
      totalAmount: p.totalAmount,
      dueDate: p.dueDate ? dayjs(p.dueDate) : undefined,
      status: p.status === 'PAID' ? 'PAID' : 'UNPAID',
      notes: p.notes,
    });
    setIsModalOpen(true);
  };

  // Submit modal form
  const handleModalSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      };

      if (editingPayment) {
        await paymentApi.update(editingPayment._id, payload);
        message.success('Đã cập nhật khoản học phí');
      } else {
        await paymentApi.create(payload);
        message.success('Đã thêm khoản học phí mới');
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      message.error('Có lỗi xảy ra khi lưu thông tin');
    }
  };

  // Subject helper
  const getSubject = (p: Payment): { name: string; color: string } | null => {
    if (p.subjectId && typeof p.subjectId === 'object') {
      return { name: p.subjectId.name, color: p.subjectId.color || '#1677ff' };
    }
    const sched = p.scheduleId as any;
    if (sched?.subjectId && typeof sched.subjectId === 'object') {
      return { name: sched.subjectId.name, color: sched.subjectId.color || '#1677ff' };
    }
    return null;
  };

  // Filtered payments by tab
  const filteredPayments = useMemo(() => {
    const now = dayjs().startOf('day');
    return payments.filter((p) => {
      if (activeTab === 'UNPAID') return p.status !== 'PAID';
      if (activeTab === 'PAID') return p.status === 'PAID';
      if (activeTab === 'URGENT') {
        if (p.status === 'PAID' || !p.dueDate) return false;
        const diff = dayjs(p.dueDate).startOf('day').diff(now, 'day');
        return diff <= 7; // Overdue or due in <= 7 days
      }
      return true;
    });
  }, [payments, activeTab]);

  // Due date tag helper
  const renderDueDateBadge = (p: Payment) => {
    if (p.status === 'PAID') {
      return (
        <Space direction="vertical" size={2}>
          <Text>{p.dueDate ? dayjs(p.dueDate).format('DD/MM/YYYY') : '—'}</Text>
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Đã nộp {p.paidAt ? `(${dayjs(p.paidAt).format('DD/MM')})` : ''}
          </Tag>
        </Space>
      );
    }

    if (!p.dueDate) {
      return <Text type="secondary">Chưa đặt hạn</Text>;
    }

    const due = dayjs(p.dueDate).startOf('day');
    const today = dayjs().startOf('day');
    const diff = due.diff(today, 'day');

    if (diff < 0) {
      return (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: '#cf1322' }}>{due.format('DD/MM/YYYY')}</Text>
          <Tag color="error" icon={<ExclamationCircleOutlined />}>
            Quá hạn {Math.abs(diff)} ngày
          </Tag>
        </Space>
      );
    }

    if (diff === 0) {
      return (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: '#d46b08' }}>{due.format('DD/MM/YYYY')}</Text>
          <Tag color="volcano" icon={<ClockCircleOutlined />}>
            Hôm nay đến hạn!
          </Tag>
        </Space>
      );
    }

    if (diff <= 3) {
      return (
        <Space direction="vertical" size={2}>
          <Text>{due.format('DD/MM/YYYY')}</Text>
          <Tag color="warning" icon={<ClockCircleOutlined />}>
            Còn {diff} ngày
          </Tag>
        </Space>
      );
    }

    if (diff <= 7) {
      return (
        <Space direction="vertical" size={2}>
          <Text>{due.format('DD/MM/YYYY')}</Text>
          <Tag color="processing">Còn {diff} ngày</Tag>
        </Space>
      );
    }

    return (
      <Space direction="vertical" size={2}>
        <Text>{due.format('DD/MM/YYYY')}</Text>
        <Tag color="default">Còn {diff} ngày</Tag>
      </Space>
    );
  };

  const columns = [
    {
      title: 'Môn học / Lớp',
      key: 'subject',
      render: (_: unknown, p: Payment) => {
        const sub = getSubject(p);
        if (!sub) return <Text type="secondary">Chung</Text>;
        return (
          <Space>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: sub.color,
              }}
            />
            <Text strong>{sub.name}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Khoản thu / Kỳ',
      dataIndex: 'periodLabel',
      key: 'periodLabel',
      render: (val: string, p: Payment) => (
        <div>
          <Text strong>{val}</Text>
          {p.notes && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {p.notes}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => (
        <Text strong style={{ fontSize: 15, color: '#1677ff' }}>
          {Number(v || 0).toLocaleString('vi-VN')} đ
        </Text>
      ),
    },
    {
      title: 'Hạn nộp học phí',
      key: 'dueDate',
      render: (_: unknown, p: Payment) => renderDueDateBadge(p),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, p: Payment) => {
        if (p.status === 'PAID') {
          return <Tag color="green" icon={<CheckCircleOutlined />}>Đã hoàn thành</Tag>;
        }
        return <Tag color="volcano" icon={<ClockCircleOutlined />}>Chưa nộp</Tag>;
      },
    },
    {
      title: 'Đánh dấu nộp',
      key: 'action',
      render: (_: unknown, p: Payment) => (
        <Space wrap>
          {p.status !== 'PAID' ? (
            <Tooltip title="Bấm để đánh dấu đã nộp học phí">
              <Button
                type="primary"
                size="middle"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                icon={<CheckOutlined />}
                onClick={() => handleToggleStatus(p)}
              >
                Đánh dấu đã nộp
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Hoàn tác về Chưa nộp">
              <Button
                size="middle"
                icon={<RollbackOutlined />}
                onClick={() => handleToggleStatus(p)}
              >
                Đánh dấu chưa nộp
              </Button>
            </Tooltip>
          )}

          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEditModal(p)}
          />
          <Popconfirm
            title="Xóa khoản học phí này?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(p._id)}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quản lý học phí"
        icon="💳"
        subtitle="Theo dõi thời hạn, tình trạng thanh toán và lịch sử nộp học phí"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            style={{
              background: '#2e5239',
              borderColor: '#2e5239',
              borderRadius: 10,
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(46, 82, 57, 0.2)',
            }}
          >
            Thêm khoản học phí
          </Button>
        }
      />

      {/* Overdue / Due Soon Alert Banner */}
      {summary && (summary.overdueCount ?? 0) > 0 && (
        <Alert
          type="error"
          showIcon
          message={`⚠️ Bạn có ${summary.overdueCount} khoản học phí ĐÃ QUÁ HẠN!`}
          description="Vui lòng kiểm tra và hoàn tất nộp học phí, sau đó bấm 'Đánh dấu đã nộp'."
          style={{ marginBottom: 16 }}
        />
      )}
      {summary && (summary.overdueCount ?? 0) === 0 && (summary.dueSoonCount ?? 0) > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`⏰ Bạn có ${summary.dueSoonCount} khoản học phí sắp đến hạn nộp trong 7 ngày tới!`}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Summary Cards */}
      {summary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Tổng học phí"
                value={summary.totalAmount}
                formatter={(v) => `${Number(v).toLocaleString('vi-VN')}đ`}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Chưa nộp"
                value={summary.remainingAmount}
                formatter={(v) => `${Number(v).toLocaleString('vi-VN')}đ`}
                valueStyle={{ color: summary.remainingAmount > 0 ? '#cf1322' : 'inherit' }}
                suffix={<span style={{ fontSize: 12, color: '#8c8c8c' }}>({summary.unpaidCount} khoản)</span>}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Đã nộp"
                value={summary.paidAmount}
                formatter={(v) => `${Number(v).toLocaleString('vi-VN')}đ`}
                valueStyle={{ color: '#389e0d' }}
                suffix={<span style={{ fontSize: 12, color: '#8c8c8c' }}>({summary.paidCount} khoản)</span>}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Quá hạn / Sắp đến hạn"
                value={(summary.overdueCount ?? 0) + (summary.dueSoonCount ?? 0)}
                valueStyle={{
                  color:
                    (summary.overdueCount ?? 0) > 0
                      ? '#cf1322'
                      : (summary.dueSoonCount ?? 0) > 0
                      ? '#d46b08'
                      : '#389e0d',
                }}
                prefix={<ClockCircleOutlined />}
                suffix={
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    ({summary.overdueCount ?? 0} quá hạn)
                  </span>
                }
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabs Filter */}
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as any)}
        items={[
          { key: 'ALL', label: `Tất cả (${payments.length})` },
          {
            key: 'UNPAID',
            label: `Chưa nộp (${payments.filter((p) => p.status !== 'PAID').length})`,
          },
          {
            key: 'URGENT',
            label: `Sắp đến hạn & Quá hạn (${(summary?.overdueCount ?? 0) + (summary?.dueSoonCount ?? 0)})`,
          },
          {
            key: 'PAID',
            label: `Đã nộp (${payments.filter((p) => p.status === 'PAID').length})`,
          },
        ]}
        style={{ marginBottom: 12 }}
      />

      {/* Table */}
      <Card bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={filteredPayments}
          columns={columns}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 850 }}
          pagination={{ pageSize: 10, showTotal: (t) => `Tổng số ${t} khoản` }}
        />
      </Card>

      {/* Modal Add/Edit Tuition */}
      <Modal
        title={editingPayment ? '✏️ Chỉnh sửa khoản học phí' : '➕ Thêm khoản học phí cần theo dõi'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText={editingPayment ? 'Cập nhật' : 'Tạo khoản học phí'}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleModalSubmit}>
          <Form.Item name="subjectId" label="Môn học / Lớp học">
            <Select
              placeholder="Chọn môn học (không bắt buộc)"
              allowClear
              options={subjects.map((s) => ({
                value: s._id,
                label: (
                  <Space>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: s.color,
                      }}
                    />
                    {s.name}
                  </Space>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item
            name="periodLabel"
            label="Tên khoản thu / Kỳ học"
            rules={[{ required: true, message: 'Vui lòng nhập tên khoản học phí' }]}
          >
            <Input placeholder="Ví dụ: Học phí Tháng 09/2026, Học phí Khóa 1..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalAmount"
                label="Số tiền (VND)"
                rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
              >
                <InputNumber
                  min={0}
                  step={10000}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="Hạn nộp học phí">
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                  placeholder="Chọn ngày hạn nộp"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="status" label="Trạng thái ban đầu" initialValue="UNPAID">
            <Select
              options={[
                { value: 'UNPAID', label: '🔴 Chưa nộp' },
                { value: 'PAID', label: '🟢 Đã nộp' },
              ]}
            />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ghi chú thêm (số tài khoản, giáo viên, v.v.)..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
