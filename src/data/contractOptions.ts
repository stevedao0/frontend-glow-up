export const CONTRACT_YEAR_OPTIONS = [
{ value: '2026', label: '2026' },
{ value: '2025', label: '2025' },
{ value: '2024', label: '2024' },
{ value: '2023', label: '2023' },
{ value: '2022', label: '2022' },
{ value: '2021', label: '2021' },
{ value: '2020', label: '2020' },
{ value: '2019', label: '2019' },
{ value: '2018', label: '2018' },
{ value: '2017', label: '2017' }];


export const LINH_VUC_OPTIONS = [
{ value: 'Karaoke', label: 'Karaoke' },
{ value: 'Phòng thu âm', label: 'Phòng thu âm' },
{ value: 'Phòng Thu Âm', label: 'Phòng Thu Âm' },
{ value: 'Nhà hàng', label: 'Nhà hàng' },
{ value: 'Phòng ghi âm', label: 'Phòng ghi âm' },
{ value: 'PTA', label: 'PTA' }];


export type StatusFilter =
'active' |
'expiring' |
'expired' |
'pending_renewal' |
'new' |
'unknown';

export const STATUS_OPTIONS: {value: StatusFilter;label: string;}[] = [
{ value: 'active', label: 'Còn hiệu lực' },
{ value: 'expiring', label: 'Sắp hết hạn' },
{ value: 'expired', label: 'Hết hạn' },
{ value: 'pending_renewal', label: 'Đang chờ tái ký' },
{ value: 'new', label: 'Hợp đồng mới' },
{ value: 'unknown', label: 'Chưa xác định' }];


export const FIELD_CODE_OPTIONS = [
{ value: 'PR', label: 'PR' },
{ value: 'MR', label: 'MR' }];


export const PAGE_SIZE_OPTIONS = [
{ value: '30', label: '30 / trang' },
{ value: '60', label: '60 / trang' },
{ value: '90', label: '90 / trang' },
{ value: '120', label: '120 / trang' }];
