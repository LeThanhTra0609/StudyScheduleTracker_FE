import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Progress, App, Space, Typography, Tag } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { paymentApi } from '../../api/payment.api';
import type { Payment, PaymentSummary } from '../../types';

const { Title, Text } = Typography;

const statusColors: Record<string, string> = { UNPAID: 'red', PARTIAL: 'orange', PAID: 'green' };
const statusLabels: Record<string, string> = { UNPAID: 'Chưa trả', PARTIAL: 'Trả một phần', PAID: 'Đã thanh toán' };

export default function PaymentPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [txModal, setTxModal] = useState<{ open: boolean; paymentId: string | null }>({ open: false, paymentId: null });
  const [txForm] = Form.useForm();
  const { message } = App.useApp();

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([paymentApi.getAll(), paymentApi.getSummary()]);
      setPayments(pRes.data.data);
      setSummary(sRes.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addTransaction = async (values: { amount: number; paidAt: dayjs.Dayjs; method: string; notes?: string }) => {
    if (!txModal.paymentId) return;
    try {
      await paymentApi.addTransaction(txModal.paymentId, { ...values, paidAt: values.paidAt.format('YYYY-MM-DD') });
      message.success('Đã ghi nhận thanh toán');
      setTxModal({ open: false, paymentId: null });
      load();
    } catch { message.error('Có lỗi xảy ra'); }
  };

  const columns = [
    { title: 'Tên lớp', key: 'class', render: (_: unknown, p: Payment) => {
        const s = p.scheduleId as any;
        return typeof s?.subjectId === 'object' ? s.subjectId.name : '-';
    }},
    { title: 'Kỳ', dataIndex: 'periodLabel', key: 'period' },
    { title: 'Số buổi', dataIndex: 'totalSessions', key: 'sessions' },
    { title: 'Tổng', dataIndex: 'totalAmount', key: 'total', render: (v: number) => `${v.toLocaleString('vi-VN')}đ` },
    { title: 'Đã trả', dataIndex: 'paidAmount', key: 'paid', render: (v: number) => <Text style={{ color: 'green' }}>{v.toLocaleString('vi-VN')}đ</Text> },
    { title: 'Còn lại', dataIndex: 'remainingAmount', key: 'rem', render: (v: number) => <Text style={{ color: v > 0 ? 'red' : 'inherit' }}>{v.toLocaleString('vi-VN')}đ</Text> },
    { title: 'Tiến độ', key: 'progress', render: (_: unknown, p: Payment) => <Progress percent={Math.round((p.paidAmount / (p.totalAmount || 1)) * 100)} size="small" /> },
    { title: 'Trạng thái', key: 'status', render: (_: unknown, p: Payment) => <Tag color={statusColors[p.status]}>{statusLabels[p.status]}</Tag> },
    {
      title: 'Thanh toán',
      key: 'action',
      render: (_: unknown, p: Payment) => (
        <Button size="small" type="primary" icon={<DollarOutlined />}
          onClick={() => { setTxModal({ open: true, paymentId: p._id }); txForm.resetFields(); }}
          disabled={p.status === 'PAID'}
        >
          Trả tiền
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>💰 Theo dõi học phí</Title>

      {summary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={8}><Card><Statistic title="Tổng học phí" value={summary.totalAmount} formatter={(v) => `${Number(v).toLocaleString('vi-VN')}đ`} /></Card></Col>
          <Col xs={8}><Card><Statistic title="Đã thanh toán" value={summary.paidAmount} formatter={(v) => `${Number(v).toLocaleString('vi-VN')}đ`} valueStyle={{ color: 'green' }} /></Card></Col>
          <Col xs={8}><Card><Statistic title="Còn lại" value={summary.remainingAmount} formatter={(v) => `${Number(v).toLocaleString('vi-VN')}đ`} valueStyle={{ color: summary.remainingAmount > 0 ? 'red' : 'inherit' }} /></Card></Col>
        </Row>
      )}

      <Table dataSource={payments} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 800 }} />

      <Modal title="Ghi nhận thanh toán" open={txModal.open} onCancel={() => setTxModal({ open: false, paymentId: null })} onOk={() => txForm.submit()} okText="Xác nhận">
        <Form form={txForm} layout="vertical" onFinish={addTransaction}>
          <Form.Item name="amount" label="Số tiền (VND)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Form.Item name="paidAt" label="Ngày thanh toán" rules={[{ required: true }]} initialValue={dayjs()}>
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="method" label="Phương thức" initialValue="Tiền mặt">
            <Select options={[{ value: 'Tiền mặt', label: 'Tiền mặt' }, { value: 'Chuyển khoản', label: 'Chuyển khoản' }, { value: 'Ví điện tử', label: 'Ví điện tử' }]} />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
