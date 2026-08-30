import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Typography, Spin, Select, DatePicker } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { statsApi } from '../../api/payment.api';
import type { StudyStats } from '../../types';

const { Title } = Typography;

export default function StatisticsPage() {
  const [study, setStudy] = useState<StudyStats | null>(null);
  const [weekly, setWeekly] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [tuition, setTuition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sRes, wRes, mRes, tRes] = await Promise.all([
          statsApi.getStudy(), statsApi.getWeekly(), statsApi.getMonthly({ month, year }), statsApi.getTuition(),
        ]);
        setStudy(sRes.data.data);
        setWeekly(wRes.data.data);
        setMonthly(mRes.data.data);
        setTuition(tRes.data.data);
      } finally { setLoading(false); }
    };
    load();
  }, [month, year]);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 64 }} />;

  const monthlyColumns = [
    { title: 'Môn học', dataIndex: 'name', key: 'name' },
    { title: 'Buổi hoàn thành', dataIndex: 'completed', key: 'completed' },
    { title: 'Giờ học', key: 'hours', render: (_: unknown, r: { totalMinutes: number }) => `${(r.totalMinutes / 60).toFixed(1)} giờ` },
  ];

  const tuitionColumns = [
    { title: 'Lớp học', key: 'class', render: (_: unknown, p: any) => {
        const s = p.scheduleId as any;
        return typeof s?.subjectId === 'object' ? s.subjectId.name : '-';
    }},
    { title: 'Kỳ', dataIndex: 'periodLabel', key: 'period' },
    { title: 'Tổng', dataIndex: 'totalAmount', key: 'total', render: (v: number) => `${v.toLocaleString('vi-VN')}đ` },
    { title: 'Đã trả', dataIndex: 'paidAmount', key: 'paid', render: (v: number) => `${v.toLocaleString('vi-VN')}đ` },
    { title: 'Còn lại', dataIndex: 'remainingAmount', key: 'rem', render: (v: number) => `${v.toLocaleString('vi-VN')}đ` },
  ];

  return (
    <div>
      <Title level={4}>📊 Thống kê</Title>

      {/* Overall */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><Card><Statistic title="Tổng buổi học" value={study?.total ?? 0} prefix={<BookOutlined />} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="Đã hoàn thành" value={study?.completed ?? 0} prefix={<CheckCircleOutlined style={{ color: 'green' }} />} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="Vắng mặt" value={study?.absent ?? 0} prefix={<CloseCircleOutlined style={{ color: 'red' }} />} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="Tổng giờ học" value={Math.round((study?.totalMinutes ?? 0) / 60)} suffix="giờ" prefix={<ClockCircleOutlined />} /></Card></Col>
      </Row>

      {/* This week */}
      <Card title="📅 Tuần này" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}><Statistic title="Hoàn thành" value={weekly?.completed ?? 0} /></Col>
          <Col span={8}><Statistic title="Vắng" value={weekly?.absent ?? 0} /></Col>
          <Col span={8}><Statistic title="Giờ học" value={Math.round((weekly?.totalMinutes ?? 0) / 60)} suffix="h" /></Col>
        </Row>
      </Card>

      {/* Monthly */}
      <Card
        title="📆 Theo tháng"
        extra={
          <DatePicker
            picker="month"
            value={dayjs(`${year}-${month}-01`)}
            onChange={(d) => { if (d) { setMonth(d.month() + 1); setYear(d.year()); } }}
            format="MM/YYYY"
          />
        }
        style={{ marginBottom: 16 }}
      >
        <Table dataSource={monthly?.bySubject ?? []} columns={monthlyColumns} rowKey="name" pagination={false} size="small" />
      </Card>

      {/* Tuition */}
      <Card title="💰 Thống kê học phí">
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}><Statistic title="Tổng học phí" value={tuition?.total ?? 0} formatter={(v) => `${Number(v).toLocaleString('vi-VN')}đ`} /></Col>
          <Col span={8}><Statistic title="Đã thanh toán" value={tuition?.paid ?? 0} formatter={(v) => `${Number(v).toLocaleString('vi-VN')}đ`} valueStyle={{ color: 'green' }} /></Col>
          <Col span={8}><Statistic title="Còn lại" value={tuition?.remaining ?? 0} formatter={(v) => `${Number(v).toLocaleString('vi-VN')}đ`} valueStyle={{ color: 'red' }} /></Col>
        </Row>
        <Table dataSource={tuition?.payments ?? []} columns={tuitionColumns} rowKey="_id" size="small" pagination={false} />
      </Card>
    </div>
  );
}
