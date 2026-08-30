import { useEffect, useState } from 'react';
import { Card, Button, Space, Modal, Form, Input, Popconfirm, Typography, App, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, LinkOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { locationApi } from '../../api/location.api';
import type { Location } from '../../types';

const { Title, Text } = Typography;

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
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

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>📍 Địa điểm học</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm địa điểm</Button>
      </Space>

      <Row gutter={[16, 16]}>
        {locations.map(loc => (
          <Col key={loc._id} xs={24} sm={12} lg={8}>
            <Card
              actions={[
                <EditOutlined key="edit" onClick={() => openModal(loc)} />,
                <Popconfirm key="delete" title="Xóa địa điểm này?" onConfirm={() => handleDelete(loc._id)} okText="Xóa" cancelText="Hủy">
                  <DeleteOutlined style={{ color: 'red' }} />
                </Popconfirm>,
              ]}
            >
              <Card.Meta
                avatar={<EnvironmentOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
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
