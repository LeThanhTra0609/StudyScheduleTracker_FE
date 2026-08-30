import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Popconfirm, Typography, App, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { subjectApi } from '../../api/subject.api';
import type { Subject } from '../../types';

const { Title } = Typography;
const COLORS = ['#1677ff', '#52c41a', '#ff4d4f', '#fa8c16', '#722ed1', '#13c2c2', '#eb2f96', '#f5222d', '#faad14'];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await subjectApi.getAll();
      setSubjects(res.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openModal = (subject?: Subject) => {
    setEditing(subject || null);
    form.setFieldsValue(subject || { color: '#1677ff' });
    setModalOpen(true);
  };

  const handleSubmit = async (values: Partial<Subject>) => {
    try {
      if (editing) {
        await subjectApi.update(editing._id, values);
        message.success('Đã cập nhật môn học');
      } else {
        await subjectApi.create(values);
        message.success('Đã thêm môn học');
      }
      setModalOpen(false);
      fetch();
    } catch { message.error('Có lỗi xảy ra'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await subjectApi.delete(id);
      message.success('Đã xóa môn học');
      fetch();
    } catch { message.error('Xóa thất bại'); }
  };

  const columns = [
    {
      title: 'Màu',
      dataIndex: 'color',
      key: 'color',
      width: 60,
      render: (c: string) => <span style={{ width: 20, height: 20, borderRadius: '50%', background: c, display: 'inline-block' }} />,
    },
    { title: 'Tên môn học', dataIndex: 'name', key: 'name', render: (n: string) => <strong>{n}</strong> },
    { title: 'Mã môn', dataIndex: 'code', key: 'code' },
    { title: 'Giảng viên', dataIndex: 'teacher', key: 'teacher' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: unknown, s: Subject) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openModal(s)} />
          <Popconfirm title="Xóa môn học này?" onConfirm={() => handleDelete(s._id)} okText="Xóa" cancelText="Hủy">
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>📚 Môn học</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Thêm môn học</Button>
      </Space>

      <Table dataSource={subjects} columns={columns} rowKey="_id" loading={loading} />

      <Modal
        title={editing ? 'Chỉnh sửa môn học' : 'Thêm môn học'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? 'Cập nhật' : 'Thêm'}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Tên môn học" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="Mã môn học">
            <Input />
          </Form.Item>
          <Form.Item name="teacher" label="Giảng viên">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="color" label="Màu sắc">
            <Select
              options={COLORS.map(c => ({
                value: c,
                label: (
                  <Space><span style={{ width: 16, height: 16, borderRadius: '50%', background: c, display: 'inline-block' }} />{c}</Space>
                ),
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
