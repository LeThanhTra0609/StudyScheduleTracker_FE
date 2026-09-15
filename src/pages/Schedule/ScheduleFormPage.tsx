import { useEffect, useState, useCallback } from 'react';
import {
  Form, Input, Select, Button, DatePicker, Switch, Radio,
  Typography, Card, Space, Alert, Checkbox, InputNumber, App, Row, Col, Tag, Tooltip, Slider,
} from 'antd';
import {
  CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined,
  UserOutlined, BulbOutlined, ThunderboltOutlined, PlusOutlined, MinusOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { scheduleApi } from '../../api/schedule.api';
import { subjectApi } from '../../api/subject.api';
import { locationApi } from '../../api/location.api';
import type { Subject, Location } from '../../types';

const { Title, Text } = Typography;
const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const COLORS = [
  { value: '#1677ff', label: 'Xanh dương' },
  { value: '#52c41a', label: 'Xanh lá' },
  { value: '#ff4d4f', label: 'Đỏ' },
  { value: '#fa8c16', label: 'Cam' },
  { value: '#722ed1', label: 'Tím' },
  { value: '#13c2c2', label: 'Cyan' },
  { value: '#eb2f96', label: 'Hồng' },
  { value: '#fadb14', label: 'Vàng' },
];

const QUICK_TIMES = [
  ['6:30', '07:00', '07:30', '08:00', '09:00', '10:00'],
  ['12:00', '13:00', '13:30', '14:00', '15:00', '16:00'],
  ['17:00', '17:30', '18:00', '19:00', '19:30', '20:00'],
];

const DURATION_PRESETS = [
  { label: '45 phút', minutes: 45 },
  { label: '1 tiếng', minutes: 60 },
  { label: '1,5 tiếng', minutes: 90 },
  { label: '2 tiếng', minutes: 120 },
  { label: '2,5 tiếng', minutes: 150 },
  { label: '3 tiếng', minutes: 180 },
  { label: '4 tiếng', minutes: 240 },
];

/** Format HH:mm from total minutes since midnight */
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function timeToMinutes(t: Dayjs): number {
  return t.hour() * 60 + t.minute();
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return m + ' phút';
  if (m === 0) return h + ' tiếng';
  return h + ' tiếng ' + m + ' phút';
}

export default function ScheduleFormPage() {
  const [form] = Form.useForm();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [conflict, setConflict] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isExtraClass, setIsExtraClass] = useState(false);
  const [tuitionEnabled, setTuitionEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  // Timeline slider: [startMinutes, endMinutes]
  const [timeRange, setTimeRange] = useState<[number, number]>([480, 570]); // default 8:00 - 9:30
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const isEdit = Boolean(id);

  const sessionDuration = timeRange[1] - timeRange[0];

  const syncTimeToForm = useCallback((range: [number, number]) => {
    const start = dayjs('2000-01-01').add(range[0], 'minute');
    const end = dayjs('2000-01-01').add(range[1], 'minute');
    form.setFieldValue('startTime', start);
    form.setFieldValue('endTime', end);
  }, [form]);

  useEffect(() => {
    const init = async () => {
      const [subRes, locRes] = await Promise.all([subjectApi.getAll(), locationApi.getAll()]);
      setSubjects(subRes.data.data);
      setLocations(locRes.data.data);

      if (isEdit && id) {
        const res = await scheduleApi.getById(id);
        const s = res.data.data;
        const startT = dayjs('2000-01-01 ' + s.startTime);
        const endT = dayjs('2000-01-01 ' + s.endTime);
        const startMins = timeToMinutes(startT);
        const endMins = timeToMinutes(endT);
        form.setFieldsValue({
          ...s,
          date: dayjs(s.date),
          startTime: startT,
          endTime: endT,
          subjectId: typeof s.subjectId === 'object' ? s.subjectId._id : s.subjectId,
          locationId: typeof s.locationId === 'object' ? s.locationId?._id : s.locationId,
          recurringEndDate: s.recurringEndDate ? dayjs(s.recurringEndDate) : undefined,
        });
        setTimeRange([startMins, endMins]);
        setIsRecurring(s.isRecurring);
        setIsExtraClass(s.type === 'EXTRA_CLASS');
        setTuitionEnabled(s.tuition?.enabled ?? false);
        if (s.color) setSelectedColor(s.color);
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

  const handleSliderChange = (range: [number, number]) => {
    setTimeRange(range);
    syncTimeToForm(range);
    setTimeout(checkConflict, 0);
  };

  const applyQuickStart = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins = startMins + (sessionDuration > 0 ? sessionDuration : 90);
    const safeEnd = Math.min(endMins, 23 * 60 + 59);
    setTimeRange([startMins, safeEnd]);
    syncTimeToForm([startMins, safeEnd]);
    setTimeout(checkConflict, 0);
  };

  const applyDuration = (minutes: number) => {
    const newEnd = Math.min(timeRange[0] + minutes, 23 * 60 + 59);
    const newRange: [number, number] = [timeRange[0], newEnd];
    setTimeRange(newRange);
    syncTimeToForm(newRange);
    setTimeout(checkConflict, 0);
  };

  const adjustTime = (field: 'start' | 'end', delta: number) => {
    const [s, e] = timeRange;
    if (field === 'start') {
      const ns = Math.max(0, Math.min(s + delta, e - 15));
      setTimeRange([ns, e]);
      syncTimeToForm([ns, e]);
    } else {
      const ne = Math.max(s + 15, Math.min(e + delta, 23 * 60 + 59));
      setTimeRange([s, ne]);
      syncTimeToForm([s, ne]);
    }
    setTimeout(checkConflict, 0);
  };

  const sliderMarks: Record<number, string> = {
    0: '0:00',
    360: '6:00',
    480: '8:00',
    720: '12:00',
    900: '15:00',
    1080: '18:00',
    1260: '21:00',
    1439: '23:59',
  };

  const onFinish = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        date: (values.date as Dayjs).format('YYYY-MM-DD'),
        startTime: minutesToTime(timeRange[0]),
        endTime: minutesToTime(timeRange[1]),
        recurringEndDate: values.recurringEndDate
          ? (values.recurringEndDate as Dayjs).format('YYYY-MM-DD')
          : undefined,
        recurringStartDate: values.date
          ? (values.date as Dayjs).format('YYYY-MM-DD')
          : undefined,
        'tuition.enabled': tuitionEnabled,
        color: selectedColor,
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
    <div style={{ maxWidth: 780 }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #1677ff, #722ed1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CalendarOutlined style={{ color: '#fff', fontSize: 20 }} />
        </div>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {isEdit ? 'Chỉnh sửa lịch học' : 'Thêm lịch học mới'}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {isEdit ? 'Cập nhật thông tin buổi học' : 'Điền thông tin để tạo lịch học'}
          </Text>
        </div>
      </div>

      {conflict && (
        <Alert
          type="warning"
          message="Trùng lịch học"
          description="Khung giờ này trùng với một buổi học khác. Bạn vẫn có thể lưu nếu muốn."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>

        {/* === Thông tin cơ bản === */}
        <Card
          title={<Space><BulbOutlined style={{ color: '#1677ff' }} /><span>Thông tin cơ bản</span></Space>}
          style={{ marginBottom: 16 }}
          styles={{ body: { paddingBottom: 4 } }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={15}>
              <Form.Item name="subjectId" label="Môn học" rules={[{ required: true, message: 'Vui lòng chọn môn học' }]}>
                <Select
                  placeholder="Chọn môn học"
                  showSearch
                  optionFilterProp="label"
                  options={subjects.map(s => ({ value: s._id, label: s.name }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={9}>
              <Form.Item name="type" label="Loại" rules={[{ required: true, message: 'Chọn loại' }]}>
                <Radio.Group onChange={e => setIsExtraClass(e.target.value === 'EXTRA_CLASS')} style={{ width: '100%' }}>
                  <Radio.Button value="ACADEMIC" style={{ width: '50%', textAlign: 'center' }}>📚 Chính khóa</Radio.Button>
                  <Radio.Button value="EXTRA_CLASS" style={{ width: '50%', textAlign: 'center' }}>🎓 Học thêm</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="learningMethod" label="Hình thức" initialValue="OFFLINE">
                <Radio.Group style={{ width: '100%' }}>
                  <Radio.Button value="OFFLINE" style={{ width: '50%', textAlign: 'center' }}>🏫 Offline</Radio.Button>
                  <Radio.Button value="ONLINE" style={{ width: '50%', textAlign: 'center' }}>💻 Online</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="locationId" label={<Space><EnvironmentOutlined />Địa điểm</Space>}>
                <Select
                  placeholder="Chọn địa điểm"
                  allowClear showSearch optionFilterProp="label"
                  options={locations.map(l => ({ value: l._id, label: l.name }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="teacher" label={<Space><UserOutlined />Giảng viên / Gia sư</Space>}>
                <Input placeholder="Nhập tên giảng viên hoặc gia sư" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Màu hiển thị">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                  {COLORS.map(c => (
                    <Tooltip key={c.value} title={c.label}>
                      <div
                        onClick={() => { setSelectedColor(c.value); form.setFieldValue('color', c.value); }}
                        style={{
                          width: 30, height: 30, borderRadius: '50%', background: c.value,
                          cursor: 'pointer',
                          border: selectedColor === c.value ? '3px solid #fff' : '2px solid transparent',
                          outline: selectedColor === c.value ? '2px solid ' + c.value : 'none',
                          transition: 'all 0.15s',
                          transform: selectedColor === c.value ? 'scale(1.15)' : 'scale(1)',
                        }}
                      />
                    </Tooltip>
                  ))}
                </div>
                <Form.Item name="color" noStyle><span /></Form.Item>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ghi chú thêm về buổi học..." />
          </Form.Item>
        </Card>

        {/* === Ngày & Giờ học === */}
        <Card
          title={<Space><ClockCircleOutlined style={{ color: '#722ed1' }} /><span>Ngày &amp; Giờ học</span></Space>}
          style={{ marginBottom: 16 }}
        >
          {/* Date */}
          <Row gutter={16} align="middle" style={{ marginBottom: 8 }}>
            <Col xs={24} sm={10}>
              <Form.Item name="date" label="📅 Ngày học" rules={[{ required: true, message: 'Chọn ngày học' }]} style={{ marginBottom: 0 }}>
                <DatePicker
                  format="DD/MM/YYYY"
                  onChange={checkConflict}
                  style={{ width: '100%' }}
                  placeholder="Chọn ngày"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={14}>
              <Form.Item label="Chọn nhanh" style={{ marginBottom: 0 }}>
                <Space wrap>
                  {[
                    { label: 'Hôm nay', d: 0 },
                    { label: 'Ngày mai', d: 1 },
                    { label: 'Ngày kia', d: 2 },
                  ].map(item => (
                    <Tag
                      key={item.label} color="blue"
                      style={{ cursor: 'pointer', borderRadius: 20, padding: '2px 14px', fontSize: 13, userSelect: 'none' }}
                      onClick={() => { form.setFieldValue('date', dayjs().add(item.d, 'day')); setTimeout(checkConflict, 0); }}
                    >
                      {item.label}
                    </Tag>
                  ))}
                </Space>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ borderTop: '1px dashed #e0e0e0', margin: '16px 0' }} />

          {/* === Timeline Slider === */}
          <div style={{ marginBottom: 8 }}>
            <Text strong style={{ fontSize: 13 }}>⏱️ Chọn khung giờ học</Text>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
              (kéo thanh trượt để chỉnh giờ bắt đầu và kết thúc)
            </Text>
          </div>

          {/* Display current time */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f0f5ff, #f9f0ff)',
            border: '1px solid #d3adf7',
            borderRadius: 12,
            padding: '14px 20px',
            marginBottom: 16,
          }}>
            {/* Start time control */}
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>BẮT ĐẦU</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Button
                  size="small" shape="circle" icon={<MinusOutlined />}
                  onClick={() => adjustTime('start', -5)}
                />
                <div style={{
                  fontSize: 26, fontWeight: 700, color: '#1677ff',
                  minWidth: 70, textAlign: 'center', letterSpacing: 1,
                }}>
                  {minutesToTime(timeRange[0])}
                </div>
                <Button
                  size="small" shape="circle" icon={<PlusOutlined />}
                  onClick={() => adjustTime('start', 5)}
                />
              </div>
            </div>

            {/* Duration badge */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: sessionDuration > 0 ? '#722ed1' : '#d9d9d9',
                color: '#fff', borderRadius: 20,
                padding: '4px 16px', fontSize: 13, fontWeight: 600,
                transition: 'all 0.2s',
              }}>
                {sessionDuration > 0 ? formatDuration(sessionDuration) : '--'}
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>thời lượng</Text>
            </div>

            {/* End time control */}
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>KẾT THÚC</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Button
                  size="small" shape="circle" icon={<MinusOutlined />}
                  onClick={() => adjustTime('end', -5)}
                />
                <div style={{
                  fontSize: 26, fontWeight: 700, color: '#722ed1',
                  minWidth: 70, textAlign: 'center', letterSpacing: 1,
                }}>
                  {minutesToTime(timeRange[1])}
                </div>
                <Button
                  size="small" shape="circle" icon={<PlusOutlined />}
                  onClick={() => adjustTime('end', 5)}
                />
              </div>
            </div>
          </div>

          {/* Slider */}
          <div style={{ padding: '0 8px', marginBottom: 20 }}>
            <Slider
              range
              min={0}
              max={1439}
              step={5}
              value={timeRange}
              onChange={(v: number | number[]) => handleSliderChange(v as [number, number])}
              marks={sliderMarks}
              tooltip={{ formatter: (v?: number) => v !== undefined ? minutesToTime(v) : '' }}
              styles={{
                track: { background: 'linear-gradient(90deg, #1677ff, #722ed1)' },
              }}
            />
          </div>

          {/* Hidden form fields for validation */}
          <Form.Item name="startTime" noStyle rules={[{ required: true }]}>
            <span />
          </Form.Item>
          <Form.Item name="endTime" noStyle rules={[{ required: true }]}>
            <span />
          </Form.Item>

          {/* Quick start time */}
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
              <ThunderboltOutlined /> Giờ bắt đầu thường dùng:
            </Text>
            {QUICK_TIMES.map((row, ri) => (
              <Space key={ri} wrap style={{ marginBottom: 4 }}>
                {row.map(t => (
                  <Tag
                    key={t}
                    style={{
                      cursor: 'pointer', borderRadius: 20, padding: '2px 12px', fontSize: 13,
                      background: minutesToTime(timeRange[0]) === (t.length === 4 ? '0' + t : t) ? '#1677ff' : '#f0f5ff',
                      borderColor: minutesToTime(timeRange[0]) === (t.length === 4 ? '0' + t : t) ? '#1677ff' : '#adc6ff',
                      color: minutesToTime(timeRange[0]) === (t.length === 4 ? '0' + t : t) ? '#fff' : '#1d39c4',
                      fontWeight: minutesToTime(timeRange[0]) === (t.length === 4 ? '0' + t : t) ? 600 : 400,
                      transition: 'all 0.15s',
                      userSelect: 'none',
                    }}
                    onClick={() => applyQuickStart(t.length === 4 ? '0' + t : t)}
                  >
                    {t}
                  </Tag>
                ))}
              </Space>
            ))}
          </div>

          {/* Duration presets */}
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
              <ClockCircleOutlined /> Thời lượng nhanh:
            </Text>
            <Space wrap>
              {DURATION_PRESETS.map(preset => (
                <Tag
                  key={preset.minutes}
                  style={{
                    cursor: 'pointer', borderRadius: 20, padding: '2px 14px', fontSize: 13,
                    background: sessionDuration === preset.minutes ? '#722ed1' : '#f9f0ff',
                    borderColor: sessionDuration === preset.minutes ? '#722ed1' : '#d3adf7',
                    color: sessionDuration === preset.minutes ? '#fff' : '#531dab',
                    fontWeight: sessionDuration === preset.minutes ? 600 : 400,
                    transition: 'all 0.15s',
                    userSelect: 'none',
                  }}
                  onClick={() => applyDuration(preset.minutes)}
                >
                  {preset.label}
                </Tag>
              ))}
            </Space>
          </div>
        </Card>

        {/* === Lịch lặp lại === */}
        <Card
          title={<Space><span>🔁</span><span>Lịch lặp lại</span></Space>}
          style={{ marginBottom: 16 }}
          styles={{ body: { paddingBottom: 4 } }}
        >
          <Form.Item name="isRecurring" label="Lặp lại hàng tuần" valuePropName="checked">
            <Switch onChange={setIsRecurring} checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
          {isRecurring && (
            <>
              <Form.Item name="recurringDays" label="Ngày học trong tuần">
                <Checkbox.Group>
                  <Space wrap>
                    {DAYS.map((d, i) => (
                      <Checkbox key={i} value={i}>
                        <span style={{
                          display: 'inline-block', minWidth: 32, textAlign: 'center',
                          background: '#f0f5ff', borderRadius: 8,
                          padding: '2px 8px', fontWeight: 600, fontSize: 13,
                        }}>{d}</span>
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              </Form.Item>
              <Form.Item name="recurringEndDate" label="Lặp đến ngày">
                <DatePicker
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày kết thúc lặp"
                  style={{ width: '100%' }}
                  disabledDate={current => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </>
          )}
        </Card>

        {/* === Học phí === */}
        {isExtraClass && (
          <Card title="💰 Học phí (Học thêm)" style={{ marginBottom: 16 }}>
            <Form.Item label="Theo dõi học phí">
              <Switch checked={tuitionEnabled} onChange={setTuitionEnabled} checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
            {tuitionEnabled && (
              <>
                <Form.Item name={['tuition', 'paymentMethod']} label="Hình thức tính phí" initialValue="PER_SESSION">
                  <Radio.Group>
                    <Radio.Button value="PER_SESSION">📅 Theo buổi</Radio.Button>
                    <Radio.Button value="MONTHLY">🗓️ Theo tháng</Radio.Button>
                    <Radio.Button value="COURSE">📦 Cả khóa</Radio.Button>
                  </Radio.Group>
                </Form.Item>
                <Form.Item name={['tuition', 'pricePerSession']} label="Giá / buổi (VND)">
                  <InputNumber
                    min={0} style={{ width: '100%' }}
                    formatter={v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    placeholder="Nhập giá mỗi buổi học"
                  />
                </Form.Item>
                <Form.Item name={['tuition', 'chargeOnAbsent']} label="Tính phí khi nghỉ" valuePropName="checked">
                  <Switch checkedChildren="Có" unCheckedChildren="Không" />
                </Form.Item>
              </>
            )}
          </Card>
        )}

        {/* === Submit bar === */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(10px)',
          padding: '14px 0 10px',
          borderTop: '1px solid #f0f0f0',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} size="large" icon={<CalendarOutlined />}>
              {isEdit ? 'Cập nhật lịch học' : 'Thêm lịch học'}
            </Button>
            <Button size="large" onClick={() => navigate('/schedules')}>Hủy</Button>
          </Space>
          {sessionDuration > 0 && (
            <Text type="secondary" style={{ fontSize: 13 }}>
              ⏱️ <strong>{minutesToTime(timeRange[0])}</strong> – <strong>{minutesToTime(timeRange[1])}</strong>
              {'  '}({formatDuration(sessionDuration)})
            </Text>
          )}
        </div>
      </Form>
    </div>
  );
}
