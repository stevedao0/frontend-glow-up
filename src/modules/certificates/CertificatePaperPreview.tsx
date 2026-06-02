import {
  GCN_BOTTOM_ANCHOR_LAYOUTS,
  GCN_LOCKED_OFFSET,
  GCN_MID_BLOCK_LAYOUTS,
  GCN_QR_LAYOUT,
  GCN_TOP_BLOCK_LAYOUTS,
} from './certificateLayoutLocked';
import type { CertificateAlign, CertificateFieldLayout, CertificatePreviewData, CertificatePrintMode } from './certificateTypes';
import './certificatePrint.css';

const textByKey = (certificate: CertificatePreviewData, key: keyof CertificatePreviewData) => {
  return String(certificate[key] || '');
};

const formatDate = (raw: string) => {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  return value;
};

const issueDateParts = (certificate: CertificatePreviewData) => {
  const direct = {
    day: String(certificate.certificate_issue_day || '').trim(),
    month: String(certificate.certificate_issue_month || '').trim(),
    year: String(certificate.certificate_issue_year || '').trim(),
  };
  if (direct.day && direct.month && direct.year) {
    return {
      day: direct.day.padStart(2, '0'),
      month: direct.month.padStart(2, '0'),
      year: direct.year,
    };
  }
  const raw = String(certificate.certificate_issue_date || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split('-');
    return { day, month, year };
  }
  return { day: '', month: '', year: '' };
};

const textAlignClass = (align: CertificateAlign) => {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
};

type CertificatePaperPreviewProps = {
  certificate: CertificatePreviewData;
  showSafeArea?: boolean;
  showCoordinates?: boolean;
  mode?: CertificatePrintMode;
};

export function CertificatePaperPreview({
  certificate,
  showSafeArea = false,
  showCoordinates = false,
  mode = 'screen',
}: CertificatePaperPreviewProps) {
  const offsetX = mode === 'print' ? 0 : Number(certificate.offset_x_mm ?? GCN_LOCKED_OFFSET.defaultXmm);
  const offsetY = mode === 'print' ? 0 : Number(certificate.offset_y_mm ?? GCN_LOCKED_OFFSET.defaultYmm);
  const issueParts = issueDateParts(certificate);
  const anchorTextByKey: Record<string, string> = {
    contract_no: String(certificate.contract_no || '').trim(),
    effective_from: formatDate(certificate.effective_from || ''),
    effective_to: formatDate(certificate.effective_to || ''),
    certificate_issue_day: issueParts.day,
    certificate_issue_month: issueParts.month,
    certificate_issue_year: issueParts.year,
    certificate_no: String(certificate.certificate_no || '').trim(),
  };

  const fieldOffsets = certificate.fieldOffsets || {};
  const scopeColAlign = certificate.scopeColAlign || { col1: 'left', col2: 'center', col3: 'center' };

  const getFieldOffset = (key: string) => {
    const fo = fieldOffsets[key];
    return { dx: fo?.dx ?? 0, dy: fo?.dy ?? 0 };
  };

  const getColAlign = (key: string): CertificateAlign => {
    if (key === 'gcn_scope_col_1_text') return scopeColAlign.col1 ?? 'left';
    if (key === 'gcn_scope_col_2_text') return scopeColAlign.col2 ?? 'center';
    if (key === 'gcn_scope_col_3_text') return scopeColAlign.col3 ?? 'center';
    return 'left';
  };

  const boxStyle = (x: number, y: number, width: number, height: number, dx: number, dy: number) => ({
    left: `${x + offsetX + dx}mm`,
    top: `${y + offsetY + dy}mm`,
    width: `${width}mm`,
    minHeight: `${height}mm`,
  });

  const fieldStyle = (field: CertificateFieldLayout) => {
    const isScope = field.key.startsWith('gcn_scope_col_');
    const { dx, dy } = getFieldOffset(field.key);
    const align = isScope ? getColAlign(field.key) : field.align;
    return {
      ...boxStyle(field.x, field.y, field.width, field.height, dx, dy),
      fontSize: `${field.fontSize}pt`,
      lineHeight: '1.2',
      fontWeight: field.bold ? 700 : 400,
      fontFamily: '"Times New Roman", serif',
    };
  };

  const renderField = (field: CertificateFieldLayout) => {
    const isScope = field.key.startsWith('gcn_scope_col_');
    const align = isScope ? getColAlign(field.key) : field.align;
    return (
      <div
        key={field.key}
        className={`gcn-locked-field ${textAlignClass(align)} ${showSafeArea ? 'outline outline-1 outline-sky-300/70' : ''}`}
        style={fieldStyle(field)}
      >
        {textByKey(certificate, field.key)}
        {showCoordinates ? <span className="gcn-locked-coordinate-tag">{field.x},{field.y}</span> : null}
      </div>
    );
  };

  const qrImageData = String(certificate.qr_image_data || '').trim();

  return (
    <div className={`gcn-locked-paper-preview gcn-locked-paper-preview--screen`}>
      <div className="gcn-locked-paper-shell--screen">
        <div className={`gcn-locked-paper gcn-locked-paper--screen`}>
          {[...GCN_TOP_BLOCK_LAYOUTS, ...GCN_MID_BLOCK_LAYOUTS].map(renderField)}

          {GCN_BOTTOM_ANCHOR_LAYOUTS.map((field) => {
            const { dx, dy } = getFieldOffset(field.key);
            return (
              <div
                key={field.key}
                className={`gcn-locked-bottom-anchor ${textAlignClass(field.align)} ${showSafeArea ? 'outline outline-1 outline-sky-300/70' : ''}`}
                style={{
                  ...boxStyle(field.x, field.y, field.width, field.height, dx, dy),
                  fontSize: `${field.fontSize}pt`,
                  fontWeight: field.bold ? 700 : 400,
                  fontFamily: '"Times New Roman", serif',
                  lineHeight: '1.2',
                }}
              >
                <span>{anchorTextByKey[field.key] || ''}</span>
                {showCoordinates ? <span className="gcn-locked-coordinate-tag">{field.x},{field.y}</span> : null}
              </div>
            );
          })}

          <div
            className={`gcn-locked-qr-field ${showSafeArea ? 'outline outline-1 outline-sky-300/70' : ''}`}
            style={boxStyle(GCN_QR_LAYOUT.x, GCN_QR_LAYOUT.y, GCN_QR_LAYOUT.width, GCN_QR_LAYOUT.height, 0, 0)}
          >
            {qrImageData ? (
              <img src={qrImageData} alt="QR code" className="gcn-locked-qr-image" />
            ) : (
              <div className="gcn-locked-qr-placeholder">QR</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
