import { useEffect, useState } from 'react';
import {
  Form, Input, Select, Button, DatePicker, TimePicker, Switch, Radio,
  Typography, Card, Space, Alert, Checkbox, InputNumber, App, Divider,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { scheduleApi } from '../../api/schedule.api';
import { subjectApi } from '../../api/subject.api';
import { locationApi } from '../../api/location.api';
import type { Subject, Location } from '../../types';

const { Title } = Typography;
const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const COLORS = ['#1677ff', '#52c41a', '#ff4d4f', '#fa8c16', '#722ed1', '#13c2c2', '#eb2f96'];

export default function ScheduleFormPage() {
  const [form] = Form.useForm();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [conflict, setConflict] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isExtraClass, setIsExtraClass] = useState(false);
  const [tuitionEnabled, setTuitionEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const isEdit = Boolean(id);

  useEffect(() => {
    const init = async () => {
      const [subRes, locRes] = await Promise.all([subjectApi.getAll(), locationApi.getAll()]);
      setSubjects(subRes.data.data);
      setLocations(locRes.data.data);

      if (isEdit && id) {
        const res = await scheduleApi.getById(id);
        const s = res.data.data;
        form.setFieldsValue({
          ...s,
          date: dayjs(s.date),
          startTime: dayjs(`2000-01-01 ${s.startTime}`),
          endTime: dayjs(`2000-01-01 ${s.endTime}`),
          subjectId: typeof s.subjectId === 'object' ? s.subjectId._id : s.subjectId,
          locationId: typeof s.locationId === 'object' ? s.locationId?._id : s.locationId,
          recurringEndDate: s.recurringEndDate ? dayjs(s.recurringEndDate) : undefined,
        });
        setIsRecurring(s.isRecurring);
        setIsExtraClass(s.type === 'EXTRA_CLASS');
        setTuitionEnabled(s.tuition?.enabled ?? false);
      }
    };
    init();
  }, [id]);

  const checkConflict = async () => {
    const date = form.getFieldValue('date');
    const startTime = form.getFieldValue('startTime');
    const endTime = form.getFieldValue('endTime');
    if (!date || !startTime || !endTime) return;

    try {
      const res = await scheduleApi.checkConflict({
        date: date.format('YYYY-MM-DD'),
        startTime: startTime.format('HH:mm'),
        endTime: endTime.format('HH:mm'),
        ...(isEdit && id ? { excludeId: id } : {}),
      });
      setConflict(res.data.hasConflict);
    } catch {}
  };

  const onFinish = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        date: (values.date as dayjs.Dayjs).format('YYYY-MM-DD'),
        startTime: (values.startTime as dayjs.Dayjs).format('HH:mm'),
        endTime: (values.endTime as dayjs.Dayjs).format('HH:mm'),
        recurringEndDate: values.recurringEndDate ? (values.recurringEndDate as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
        recurringStartDate: values.date ? (values.date as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
        'tuition.enabled': tuitionEnabled,
      };

      if (isEdit && id) {
        await scheduleApi.update(id, payload);
        message.success('Cập nhật lịch học thành công');
      } else {
        await scheduleApi.create(payload);
        message.success('Thêm lịch học thành công');
      }
      navigate('/schedules');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <Title level={4}>{isEdit ? '✏️ Chỉnh sửa lịch học' : '➕ Thêm lịch học'}</Title>

      {conflict && (
        <Alert
          type="warning"
          message="⚠️ Lịch học trùng với buổi học khác. Bạn vẫn có thể tiếp tục nếu muốn."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Card title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
          <Form.Item name="subjectId" label="Môn học" rules={[{ required: true }]}>
            <Select placeholder="Chọn môn học" options={subjects.map(s => ({ value: s._id, label: s.name }))} />
          </Form.Item>

          <Form.Item name="type" label="Loại lịch học" rules={[{ required: true }]}>
            <Radio.Group onChange={e => setIsExtraClass(e.target.value === 'EXTRA_CLASS')}>
              <Radio.Button value="ACADEMIC">📚 Chính khóa</Radio.Button>
              <Radio.Button value="EXTRA_CLASS">🎓 Học thêm</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Space wrap>
            <Form.Item name="date" label="Ngày học" rules={[{ required: true }]}>
              <DatePicker format="DD/MM/YYYY" onChange={checkConflict} />
            </Form.Item>
            <Form.Item name="startTime" label="Bắt đầu" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" minuteStep={15} onChange={checkConflict} />
            </Form.Item>
            <Form.Item name="endTime" label="Kết thúc" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" minuteStep={15} onChange={checkConflict} />
            </Form.Item>
          </Space>

          <Form.Item name="locationId" label="Địa điểm">
            <Select placeholder="Chọn địa điểm" allowClear options={locations.map(l => ({ value: l._id, label: l.name }))} />
          </Form.Item>

          <Form.Item name="learningMethod" label="Hình thức học" initialValue="OFFLINE">
            <Radio.Group>
              <Radio.Button value="OFFLINE">🏫 Offline</Radio.Button>
              <Radio.Button value="ONLINE">💻 Online</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="teacher" label="Giảng viên / Gia sư">
            <Input placeholder="Tên giảng viên" />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ghi chú thêm..." />
          </Form.Item>

          <Form.Item name="color" label="Màu hiển thị">
            <Select>
              {COLORS.map(c => (
                <Select.Option key={c} value={c}>
                  <Space><span style={{ width: 16, height: 16, borderRadius: '50%', background: c, display: 'inline-block' }} />{c}</Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        {/* Recurring */}
        <Card title="Lịch lặp lại" style={{ marginBottom: 16 }}>
          <Form.Item name="isRecurring" label="Lặp lại hàng tuần" valuePropName="checked">
            <Switch onChange={setIsRecurring} />
          </Form.Item>
          {isRecurring && (
            <>
              <Form.Item name="recurringDays" label="Ngày trong tuần">
                <Checkbox.Group options={DAYS.map((d, i) => ({ label: d, value: i }))} />
              </Form.Item>
              <Form.Item name="recurringEndDate" label="Ngày kết thúc">
                <DatePicker format="DD/MM/YYYY" />
              </Form.Item>
            </>
          )}
        </Card>

        {/* Tuition - Extra Class only */}
        {isExtraClass && (
          <Card title="💰 Học phí (Học thêm)" style={{ marginBottom: 16 }}>
            <Form.Item label="Theo dõi học phí">
              <Switch checked={tuitionEnabled} onChange={setTuitionEnabled} />
            </Form.Item>
            {tuitionEnabled && (
              <>
                <Form.Item name={['tuition', 'paymentMethod']} label="Hình thức tính phí" initialValue="PER_SESSION">
                  <Radio.Group>
                    <Radio value="PER_SESSION">Theo buổi</Radio>
                    <Radio value="MONTHLY">Theo tháng</Radio>
                    <Radio value="COURSE">Cả khóa</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item name={['tuition', 'pricePerSession']} label="Giá / buổi (VND)">
                  <InputNumber min={0} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
                <Form.Item name={['tuition', 'chargeOnAbsent']} label="Tính phí khi nghỉ" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </>
            )}
          </Card>
        )}

        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEdit ? 'Cập nhật' : 'Thêm lịch học'}
          </Button>
          <Button onClick={() => navigate('/schedules')}>Hủy</Button>
        </Space>
      </Form>
    </div>
  );
}
