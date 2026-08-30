import { Tag } from 'antd';
import type { ScheduleStatus, ScheduleType } from '../../types';

const statusConfig: Record<ScheduleStatus, { color: string; label: string }> = {
  UPCOMING: { color: 'blue', label: 'Sắp diễn ra' },
  COMPLETED: { color: 'green', label: 'Đã hoàn thành' },
  ABSENT: { color: 'red', label: 'Vắng mặt' },
  EXCUSED: { color: 'orange', label: 'Vắng có phép' },
  CANCELLED: { color: 'default', label: 'Đã hủy' },
};

const typeConfig: Record<ScheduleType, { color: string; label: string }> = {
  ACADEMIC: { color: 'blue', label: 'Chính khóa' },
  EXTRA_CLASS: { color: 'purple', label: 'Học thêm' },
};

export const StatusBadge = ({ status }: { status: ScheduleStatus }) => {
  const cfg = statusConfig[status] || { color: 'default', label: status };
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
};

export const TypeBadge = ({ type }: { type: ScheduleType }) => {
  const cfg = typeConfig[type] || { color: 'default', label: type };
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
};
