export const VCPMC_STATS = {
  totalBackground: 3365,
  active: 121,
  expiringIn30Days: 8,
  expiringIn60Days: 26,
  expired: 3107,
  pendingRenewal: 1,
  renewed: 1,
  totalWorks: 80_759,
  gcnDraft: 1_940,
  gcnTestPrinted: 6,
  gcnFinalPrinted: 655,
  revenue2026: 1_075_536_342,
  revenue2025: 2_648_796_600
};

// Status breakdown for dashboard panel.
// Numbers are real but categories overlap (active includes expiring); panel normalizes
// against the max bar instead of total so the visual stays meaningful.
export const STATUS_BREAKDOWN = [
{
  key: 'active',
  name: 'Đang hiệu lực',
  value: 121,
  tone: 'success' as const
},
{
  key: 'expiring',
  name: 'Sắp hết 60 ngày',
  value: 26,
  tone: 'warning' as const
},
{ key: 'expired', name: 'Hết hạn', value: 3107, tone: 'danger' as const },
{ key: 'pending', name: 'Chờ tái ký', value: 1, tone: 'violet' as const },
{ key: 'renewed', name: 'Đã tái ký', value: 1, tone: 'info' as const }];


// Year-over-year revenue comparison (real numbers from sample data)
export const REVENUE_BY_YEAR = [
{ year: '2025', revenue: 2_648_796_600 },
{ year: '2026', revenue: 1_075_536_342 }];


export type ActivityKind =
'create' |
'print' |
'update' |
'dispatch' |
'approve';

// Real activities tied to real contract numbers (from CONTRACT_RECORDS).
export const RECENT_ACTIVITIES: {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  kind: ActivityKind;
}[] = [
{
  id: 'a1',
  actor: 'Tuấn',
  action: 'đã tạo hợp đồng',
  target: '0645/2026/HĐQTGAN-PN/PR',
  time: '5 phút trước',
  kind: 'create'
},
{
  id: 'a2',
  actor: 'Admin',
  action: 'in chính thức GCN cho',
  target: '0581/2026/HĐQTGAN-PN/PR',
  time: '32 phút trước',
  kind: 'print'
},
{
  id: 'a3',
  actor: 'Nhân viên 1',
  action: 'cập nhật hợp đồng',
  target: '0042/2026/HĐQTGAN-PN/PR',
  time: '1 giờ trước',
  kind: 'update'
},
{
  id: 'a4',
  actor: 'Tuấn',
  action: 'duyệt tái ký',
  target: '0553/2026/HĐQTGAN-PN/PR',
  time: '3 giờ trước',
  kind: 'approve'
},
{
  id: 'a5',
  actor: 'Admin',
  action: 'cập nhật trạng thái',
  target: '0503/2026/HĐQTGAN-PN/PR',
  time: 'Hôm qua',
  kind: 'dispatch'
}];


// Real expiring contracts (from sample data)
export const EXPIRING_CONTRACTS = [
{
  id: 'e1',
  partner: 'HỘ KINH DOANH KARAOKE 456',
  contractNo: '0534/2025/HĐQTGAN-PN/PR',
  expireDate: '2026-05-09',
  daysLeft: 1,
  value: 4_800_000
},
{
  id: 'e2',
  partner: 'HỘ KINH DOANH QUANG MINH',
  contractNo: '0523/2025/HĐQTGAN-PN/PR',
  expireDate: '2026-05-09',
  daysLeft: 1,
  value: 21_750_000
},
{
  id: 'e3',
  partner: 'CÔNG TY TNHH KARAOKE GIA ĐÌNH TÌNH CA',
  contractNo: '0713/2025/HĐQTGAN-PN/PR',
  expireDate: '2026-05-13',
  daysLeft: 5,
  value: 25_500_000
},
{
  id: 'e4',
  partner: 'CÔNG TY TNHH MTV TÂN XUKA',
  contractNo: '0984/2025/HĐQTGAN-PN/PR',
  expireDate: '2026-05-13',
  daysLeft: 5,
  value: 8_800_000
},
{
  id: 'e5',
  partner: 'HỘ KINH DOANH KARAOKE B-BOX',
  contractNo: '0714/2025/HĐQTGAN-PN/PR',
  expireDate: '2026-05-15',
  daysLeft: 7,
  value: 29_000_000
}];