import { useEffect, useState } from 'react';
import { Card, Button, Space, Modal, Form, Input, Popconfirm, Typography, App, Row, Col, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, LinkOutlined, VideoCameraOutlined, SearchOutlined } from '@ant-design/icons';
import { locationApi } from '../../api/location.api';
import { PageHeader } from '../../components/common/PageHeader';
import type { Location } from '../../types';

const { Text } = Typography;

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetch = async () => {
    setLoading(true);
    try { const res = await locationApi.getAll(); setLocations(res.data.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openModal = (loc?: Location) => {
    setEditing(loc || null);
    form.setFieldsValue(loc || {});
    setModalOpen(true);
  };

  const handleSubmit = async (values: Partial<Location>) => {
    try {
      if (editing) { await locationApi.update(editing._id, values); message.success('Đã cập nhật địa điểm'); }
      else { await locationApi.create(values); message.success('Đã thêm địa điểm'); }
      setModalOpen(false);
      fetch();
    } catch { message.error('Có lỗi xảy ra'); }
  };

  const handleDelete = async (id: string) => {
    try { await locationApi.delete(id); message.success('Đã xóa'); fetch(); }
    catch { message.error('Xóa thất bại'); }
  };

  const filtered = locations.filter(l => {
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q) ||
      (l.address && l.address.toLowerCase().includes(q)) ||
      (l.description && l.description.toLowerCase().includes(q));
  });

  return (
    <div>
      <PageHeader
        title="Địa điểm học"
        icon="📍"
        subtitle="Quản lý các cơ sở học tập, phòng học trực tiếp và đường dẫn lớp học trực tuyến"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
            style={{
              borderRadius: 10,
              fontWeight: 700,
              background: '#2e5239',
              borderColor: '#2e5239',
              boxShadow: '0 2px 8px rgba(46, 82, 57, 0.2)',
            }}
          >
            Thêm địa điểm
          </Button>
        }
      />

      {/* ── SEARCH & FILTER WHITE CARD ── */}
      <div className="cozy-filter-card">
        <Input
          prefix={<SearchOutlined style={{ color: '#2e5239' }} />}
          placeholder="Tìm kiếm địa điểm theo tên hoặc địa chỉ..."
          value={search}
          allowClear
          onChange={e => setSearch(e.target.value)}
          className="cozy-search-input"
          style={{ flex: '1 1 300px', maxWidth: 450 }}
        />
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6e7f72', fontWeight: 600 }}>
          Hiển thị <strong style={{ color: '#2e5239' }}>{filtered.length}</strong> / {locations.length} địa điểm
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px 0', borderRadius: 16 }}>
          <Empty description="Không tìm thấy địa điểm nào phù hợp" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map(loc => (
            <Col key={loc._id} xs={24} sm={12} lg={8}>
              <Card
                style={{ borderRadius: 16, border: '1px solid #eef2ee', boxShadow: '0 2px 8px rgba(40,60,44,0.03)' }}
                actions={[
                  <EditOutlined key="edit" onClick={() => openModal(loc)} />,
                  <Popconfirm key="delete" title="Xóa địa điểm này?" onConfirm={() => handleDelete(loc._id)} okText="Xóa" cancelText="Hủy">
                    <DeleteOutlined style={{ color: 'red' }} />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  avatar={<EnvironmentOutlined style={{ fontSize: 24, color: '#2e5239' }} />}
                  title={loc.name}
                  description={
                    <Space direction="vertical" size={4}>
                      {loc.address && <Text type="secondary">{loc.address}</Text>}
                      {loc.mapLink && <a href={loc.mapLink} target="_blank" rel="noreferrer"><LinkOutlined /> Xem bản đồ</a>}
                      {loc.meetingLink && <a href={loc.meetingLink} target="_blank" rel="noreferrer"><VideoCameraOutlined /> Meeting link</a>}
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal title={editing ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} okText={editing ? 'Cập nhật' : 'Thêm'}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Tên địa điểm" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="address" label="Địa chỉ"><Input /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="mapLink" label="Link bản đồ"><Input placeholder="https://maps.google.com/..." /></Form.Item>
          <Form.Item name="meetingLink" label="Link học online"><Input placeholder="https://meet.google.com/..." /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
