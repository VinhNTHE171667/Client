import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function toMySQLDateVN(isoString: string): string {
  return dayjs(isoString).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
}
