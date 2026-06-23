/**
 * MusicUsageAreaSection - Bảng Khu vực sử dụng âm nhạc
 * 
 * Component dùng chung cho toàn bộ lĩnh vực Background:
 * - Karaoke, Cafe, Nha hang, Khach san, etc.
 * - Không hard-code Karaoke/Khu vui choi
 * 
 * Design: Word/Excel print-ready, administrative form style
 */

import React from 'react';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { Button } from '../app-ui/Button';
import {
  DOMAIN_SUGGESTION_TEMPLATES,
  type DomainSuggestionTemplate,
} from '../../data/createContractOptions';
import type { BackgroundDomainCode } from '../../lib/contractCreateTypes';

export type MusicUsageArea = {
  id: string;
  areaName: string;
  scaleDescription: string;
  musicUsageType: string;
};

export type MusicUsageAreaSectionProps = {
  /** List of music usage areas - controlled component */
  value: MusicUsageArea[];
  /** Callback when areas change - always provide new array (immutable) */
  onChange: (areas: MusicUsageArea[]) => void;
  /** Domain-specific music usage type options */
  musicUsageTypeOptions?: { value: string; label: string }[];
  /** Scale description label (varies by domain) */
  scaleLabel?: string;
  /** Domain code for suggestion templates */
  domainCode?: string;
  /** Read-only mode */
  readOnly?: boolean;
};

/** Default music usage type options */
const DEFAULT_MUSIC_USAGE_OPTIONS = [
  { value: 'Sử dụng nhạc qua đầu Karaoke', label: 'Sử dụng nhạc qua đầu Karaoke' },
  { value: 'Phát nhạc nền', label: 'Phát nhạc nền' },
  { value: 'Biểu diễn âm nhạc trực tiếp', label: 'Biểu diễn âm nhạc trực tiếp' },
  { value: 'Phát nhạc qua thiết bị nghe nhìn', label: 'Phát nhạc qua thiết bị nghe nhìn' },
  { value: 'Kết hợp (nhiều hình thức)', label: 'Kết hợp (nhiều hình thức)' },
];

function generateId(): string {
  return `area-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function MusicUsageAreaSection({
  value,
  onChange,
  musicUsageTypeOptions = DEFAULT_MUSIC_USAGE_OPTIONS,
  scaleLabel = 'Quy mô, sức chứa',
  domainCode,
  readOnly = false,
}: MusicUsageAreaSectionProps) {
  // Safe array handling - always ensure value is an array
  const rows: MusicUsageArea[] = Array.isArray(value) ? value : [];
  
  const templates = domainCode && DOMAIN_SUGGESTION_TEMPLATES[domainCode] 
    ? DOMAIN_SUGGESTION_TEMPLATES[domainCode] 
    : [];
  const hasTemplates = templates.length > 0;

  /** Add new row - immutable update */
  const handleAdd = () => {
    const newArea: MusicUsageArea = {
      id: generateId(),
      areaName: '',
      scaleDescription: '',
      musicUsageType: musicUsageTypeOptions[0]?.value || '',
    };
    // IMMUTABLE: create new array, never mutate existing
    onChange([...rows, newArea]);
  };

  /** Delete row - immutable update */
  const handleDelete = (id: string) => {
    // IMMUTABLE: create new array filtering out the deleted row
    onChange(rows.filter((a) => a.id !== id));
  };

  /** Update field - immutable update */
  const handleUpdate = (id: string, field: keyof MusicUsageArea, fieldValue: string) => {
    // IMMUTABLE: create new array with updated row
    onChange(
      rows.map((a) => (a.id === id ? { ...a, [field]: fieldValue } : a))
    );
  };

  /** Apply suggestion template */
  const handleApplyTemplate = () => {
    const newAreas: MusicUsageArea[] = templates.map((t: DomainSuggestionTemplate) => ({
      id: generateId(),
      areaName: t.areaName,
      scaleDescription: t.scaleDescription,
      musicUsageType: t.musicUsageType,
    }));
    // IMMUTABLE: create new array with template rows appended
    onChange([...rows, ...newAreas]);
  };

  return (
    <div className="music-usage-area-section">
      {/* Header with Add button + Template suggestion */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
          Khu vực sử dụng âm nhạc
        </h4>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {hasTemplates && (
              <button
                onClick={handleApplyTemplate}
                className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2"
                type="button"
              >
                Dùng mẫu gợi ý
              </button>
            )}
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              type="button"
            >
              + Thêm khu vực
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable wrapper — cuộn dọc khi nhiều khu vực (tòa nhà nhiều tầng, sân vườn, ngoài trời...) */}
      <div
        className={
          rows.length > 8
            ? 'max-h-[480px] overflow-y-auto rounded border border-black'
            : ''
        }
      >
      <table className="music-usage-table">
        <colgroup>
          <col style={{ width: '30%' }} />
          <col style={{ width: '35%' }} />
          <col style={{ width: '35%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Vị trí / khu vực sử dụng âm nhạc</th>
            <th>{scaleLabel}</th>
            <th>Hình thức sử dụng âm nhạc</th>
          </tr>
        </thead>
        <tbody>
          {/* Empty state - always show a row when no data */}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-zinc-500 italic">
                    Chưa có khu vực sử dụng âm nhạc nào.
                  </p>
                  <p className="text-xs text-zinc-400">
                    Nhấn{" "}
                    <span className="font-medium text-blue-600">"+ Thêm khu vực"</span>{" "}
                    để bắt đầu.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((area, idx) => (
              <tr key={area.id}>
                {/* Column 1: Area name */}
                <td>
                  {readOnly ? (
                    <span className="px-2 py-1">{area.areaName || '—'}</span>
                  ) : (
                    <input
                      type="text"
                      value={area.areaName}
                      onChange={(e) => handleUpdate(area.id, 'areaName', e.target.value)}
                      placeholder="VD: Tầng 5, Sân vườn, Khu vui chơi..."
                      className="table-input"
                    />
                  )}
                </td>
                {/* Column 2: Scale description */}
                <td>
                  {readOnly ? (
                    <span className="px-2 py-1">{area.scaleDescription || '—'}</span>
                  ) : (
                    <input
                      type="text"
                      value={area.scaleDescription}
                      onChange={(e) => handleUpdate(area.id, 'scaleDescription', e.target.value)}
                      placeholder="VD: 10 phòng, 80 chỗ, 120m²..."
                      className="table-input"
                    />
                  )}
                </td>
                {/* Column 3: Music usage type + Delete */}
                <td>
                  <div className="flex items-center gap-2">
                    {readOnly ? (
                      <span className="px-2 py-1">{area.musicUsageType || '—'}</span>
                    ) : (
                      <input
                        type="text"
                        value={area.musicUsageType}
                        onChange={(e) => handleUpdate(area.id, 'musicUsageType', e.target.value)}
                        placeholder="VD: Sử dụng nhạc qua đầu Karaoke..."
                        className="table-input"
                      />
                    )}
                    {!readOnly && (
                      <button
                        onClick={() => handleDelete(area.id)}
                        className="text-zinc-400 hover:text-rose-500 transition-colors p-1 rounded flex-shrink-0"
                        title={`Xóa khu vực #${idx + 1}`}
                        type="button"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {/* Row count + scroll hint */}
      {rows.length > 0 && (
        <p className="text-xs text-zinc-500 mt-2 flex items-center gap-2">
          <span>Tổng cộng: <strong className="text-zinc-700">{rows.length}</strong> khu vực</span>
          {rows.length > 8 && (
            <span className="text-amber-600 italic">· Cuộn dọc trong bảng để xem hết</span>
          )}
        </p>
      )}

      <style>{`
        .music-usage-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-family: "Times New Roman", Times, serif;
          font-size: 14px;
          color: #000;
          background: #fff;
          border: 1px solid #000;
        }

        .music-usage-table th,
        .music-usage-table td {
          border: 1px solid #000;
          padding: 6px 8px;
          vertical-align: middle;
        }

        .music-usage-table th {
          background: #d9d9d9;
          font-weight: 700;
          text-align: center;
        }

        .music-usage-table td {
          background: #fff;
        }

        .table-input {
          width: 100%;
          border: none;
          background: transparent;
          font-family: inherit;
          font-size: inherit;
          color: #000;
          outline: none;
          padding: 2px 4px;
        }

        .table-input:focus {
          background: #f0f9ff;
        }

        .table-input::placeholder {
          color: #999;
          font-style: italic;
        }

        @media print {
          .music-usage-table {
            font-size: 12px;
          }

          .music-usage-table th,
          .music-usage-table td {
            padding: 4px 6px;
          }

          .table-input {
            background: transparent;
          }

          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Preview-only read-only table for display purposes
 */
export function MusicUsageAreaTablePreview({
  value,
  scaleLabel = 'Quy mô, sức chứa',
}: {
  value: MusicUsageArea[];
  scaleLabel?: string;
}) {
  const rows: MusicUsageArea[] = Array.isArray(value) ? value : [];
  
  return (
    <table className="music-usage-table">
      <colgroup>
        <col style={{ width: '30%' }} />
        <col style={{ width: '35%' }} />
        <col style={{ width: '35%' }} />
      </colgroup>
      <thead>
        <tr>
          <th>Vị trí / khu vực sử dụng âm nhạc</th>
          <th>{scaleLabel}</th>
          <th>Hình thức sử dụng âm nhạc</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={3} className="text-center py-4 text-zinc-500">
              (Không có thông tin khu vực sử dụng âm nhạc)
            </td>
          </tr>
        ) : (
          rows.map((area) => (
            <tr key={area.id}>
              <td>{area.areaName || '—'}</td>
              <td>{area.scaleDescription || '—'}</td>
              <td>{area.musicUsageType || '—'}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
