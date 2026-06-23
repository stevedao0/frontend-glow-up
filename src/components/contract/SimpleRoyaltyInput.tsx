/**
 * SimpleRoyaltyInput - Simplified royalty payment input
 * 
 * User only enters: royalty_amount_before_vat
 * App auto-calculates: vat_rate (8%), vat_amount, total, amount_in_words
 * 
 * Design: Clean, administrative form style
 */

import React, { useState, useEffect } from 'react';

export type SimpleRoyaltyData = {
  /** Tiền bản quyền trước thuế */
  royaltyAmountBeforeVat: number;
  /** Thuế GTGT (%) - default 8 */
  vatRate: number;
  /** Tiền thuế GTGT - calculated */
  vatAmount: number;
  /** Tổng tiền sau thuế - calculated */
  totalAmountAfterVat: number;
  /** Số tiền bằng chữ */
  amountInWords: string;
};

export type SimpleRoyaltyInputProps = {
  /** Initial data */
  initialData?: Partial<SimpleRoyaltyData>;
  /** Callback when data changes */
  onChange: (data: SimpleRoyaltyData) => void;
  /** VAT rate options */
  vatRateOptions?: { value: number; label: string }[];
  /** Default VAT rate */
  defaultVatRate?: number;
};

const DEFAULT_VAT_RATE = 8;

/**
 * Convert number to Vietnamese words for currency
 */
export function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không đồng';

  const units = ['', 'nghìn', 'triệu', 'tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  
  function readThreeDigits(n: number): string {
    if (n === 0) return '';
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let result = '';
    
    if (hundred > 0) {
      result += (hundred === 1 ? 'một' : digits[hundred]) + ' trăm ';
    }
    
    if (remainder > 0) {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      
      if (tens > 1) {
        result += digits[tens] + ' mươi ';
        if (ones > 0) {
          result += (ones === 1 ? 'mốt' : digits[ones]);
        }
      } else if (tens === 1) {
        result += 'mười ';
        if (ones > 0) {
          result += (ones === 5 ? 'lăm' : digits[ones]);
        }
      } else {
        result += digits[ones];
      }
    }
    
    return result;
  }
  
  const str = num.toString();
  const len = str.length;
  let result = '';
  let unitIndex = 0;
  
  // Process from right to left, 3 digits at a time
  for (let i = len - 3; i >= 0; i -= 3) {
    const chunk = parseInt(str.slice(Math.max(0, i), i + 3), 10);
    if (chunk > 0) {
      result = readThreeDigits(chunk) + ' ' + units[unitIndex] + ' ' + result;
    }
    unitIndex++;
  }
  
  // Handle the first chunk (may be 1-3 digits)
  const firstChunk = parseInt(str.slice(0, Math.min(3, len)), 10);
  if (unitIndex === 0 || firstChunk > 0) {
    result = readThreeDigits(firstChunk) + (unitIndex > 0 ? ' ' + units[unitIndex] : '') + ' ' + result;
  }
  
  return result.trim().charAt(0).toUpperCase() + result.trim().slice(1);
}

/**
 * Format number as Vietnamese currency
 */
function formatVnd(value: number): string {
  return value.toLocaleString('vi-VN').replace(/,/g, '.');
}

export function SimpleRoyaltyInput({
  initialData,
  onChange,
  vatRateOptions = [
    { value: 0, label: '0%' },
    { value: 5, label: '5%' },
    { value: 8, label: '8%' },
    { value: 10, label: '10%' },
  ],
  defaultVatRate = DEFAULT_VAT_RATE,
}: SimpleRoyaltyInputProps) {
  const [royaltyAmount, setRoyaltyAmount] = useState<number>(
    initialData?.royaltyAmountBeforeVat || 0
  );
  const [vatRate, setVatRate] = useState<number>(
    initialData?.vatRate || defaultVatRate
  );
  const [manualVatRate, setManualVatRate] = useState<string>(
    String(initialData?.vatRate || defaultVatRate)
  );

  // Calculate derived values
  const vatAmount = Math.round(royaltyAmount * vatRate / 100);
  const totalAmount = royaltyAmount + vatAmount;
  const amountInWords = numberToVietnameseWords(totalAmount);

  // Notify parent of changes
  useEffect(() => {
    onChange({
      royaltyAmountBeforeVat: royaltyAmount,
      vatRate,
      vatAmount,
      totalAmountAfterVat: totalAmount,
      amountInWords,
    });
  }, [royaltyAmount, vatRate, vatAmount, totalAmount, amountInWords, onChange]);

  const handleAmountChange = (value: string) => {
    const num = parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
    setRoyaltyAmount(num);
  };

  const handleVatRateChange = (value: number) => {
    setVatRate(value);
    setManualVatRate(String(value));
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
          Thông tin tiền tham khảo
        </h4>
        <span className="text-xs text-zinc-400 italic">Nội bộ</span>
      </div>
      {/* Royalty Amount Input */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          Tiền bản quyền trước thuế <span className="text-zinc-400 font-normal">(VND)</span> *
        </label>
        <div className="relative">
          <input
            type="text"
            value={formatVnd(royaltyAmount)}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0"
            className="w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-md text-right font-mono text-lg"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-500 font-medium">
            ₫
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Nhập số tiền bản quyền chưa có thuế GTGT
        </p>
      </div>

      {/* VAT Rate */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Thuế suất GTGT
          </label>
          <div className="relative">
            <select
              value={vatRate}
              onChange={(e) => handleVatRateChange(Number(e.target.value))}
              className="w-full pl-3 pr-8 py-2 border border-zinc-300 rounded-md appearance-none bg-white"
            >
              {vatRateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400">
              ▾
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Tiền thuế GTGT
          </label>
          <div className="relative">
            <input
              type="text"
              value={formatVnd(vatAmount)}
              readOnly
              className="w-full pl-3 pr-10 py-2 border border-zinc-200 rounded-md text-right font-mono bg-zinc-50 text-zinc-600"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-400 font-medium">
              ₫
            </span>
          </div>
        </div>
      </div>

      {/* Total Amount */}
      <div className="rounded-xl bg-emerald-50 p-5 border border-emerald-200">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">
            Tổng tiền thanh toán
          </p>
          <p className="text-[28px] font-bold text-emerald-800 font-mono tabular-nums tracking-tight leading-none">
            {formatVnd(totalAmount)}
            <span className="text-lg font-medium ml-0.5">đ</span>
          </p>
          <p className="text-sm text-emerald-700 mt-2 italic">
            (Bằng chữ: {amountInWords} đồng)
          </p>
        </div>
      </div>

      {/* Disclaimer: this is reference info only */}
      <div className="px-3 py-2 rounded bg-emerald-50 border border-emerald-200/60">
        <p className="text-xs text-emerald-700 italic">
          Thông tin trên chỉ mang tính tham khảo nội bộ.
          Bảng tính tiền chi tiết sẽ được bổ sung sau khi export Word.
        </p>
      </div>
    </div>
  );
}

/**
 * Read-only summary of royalty data
 */
export function SimpleRoyaltySummary({
  data,
}: {
  data: SimpleRoyaltyData;
}) {
  return (
    <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200">
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="py-1 text-zinc-600">Tiền bản quyền trước thuế:</td>
            <td className="py-1 text-right font-mono tabular-nums">{formatVnd(data.royaltyAmountBeforeVat)} đ</td>
          </tr>
          <tr>
            <td className="py-1 text-zinc-600">Thuế GTGT ({data.vatRate}%):</td>
            <td className="py-1 text-right font-mono tabular-nums">{formatVnd(data.vatAmount)} đ</td>
          </tr>
          <tr className="border-t border-emerald-200">
            <td className="py-2 font-semibold text-emerald-800">Tổng cộng:</td>
            <td className="py-2 text-right font-mono font-bold text-emerald-800 tabular-nums text-[15px]">{formatVnd(data.totalAmountAfterVat)} đ</td>
          </tr>
          <tr>
            <td colSpan={2} className="pt-2 text-center text-zinc-500 italic text-xs">
              ({data.amountInWords} đồng)
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
