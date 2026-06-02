import React, { useState, useRef } from "react";
import {
  UploadIcon,
  FileSpreadsheetIcon,
  DownloadIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  XIcon,
  LoaderIcon,
  FileIcon,
} from "lucide-react";
import { Page, PageHeader } from "../components/app-ui/Page";
import { ContentCard } from "../components/app-ui/ContentCard";
import { Button } from "../components/app-ui/Button";
import { Modal } from "../components/app-ui/Modal";
import { RouteKey } from "../data/routes";
import { importContracts, getTemplateUrl, type ImportResult } from "../lib/importClient";
import { useAuth } from "../lib/auth";

interface ImportContractsPageProps {
  onNavigate: (route: RouteKey) => void;
}

export function ImportContractsPage({ onNavigate }: ImportContractsPageProps) {
  const { currentUser, hasPermission } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Kiểm tra quyền: chỉ admin và manager được upload
  const canUpload = currentUser?.backendRole === "admin" || currentUser?.backendRole === "mod";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError("Chỉ chấp nhận file Excel (.xlsx, .xls)");
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setImportResult(null);

    try {
      const result = await importContracts(selectedFile);
      setImportResult(result);
      setShowResultModal(true);
    } catch (err: any) {
      setError(err.message || "Upload thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const url = getTemplateUrl();
    const link = document.createElement("a");
    link.href = url;
    link.download = "contract_import_template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!canUpload) {
    return (
      <Page>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircleIcon className="w-16 h-16 text-amber-500" />
          <h2 className="text-xl font-semibold text-zinc-800">Không có quyền truy cập</h2>
          <p className="text-zinc-500 text-center max-w-md">
            Chỉ admin và manager mới được phép upload dữ liệu từ file Excel.
          </p>
          <Button onClick={() => onNavigate("dashboard")}> Quay về Dashboard</Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Import Hợp Đồng"
        description="Upload file Excel để nhập dữ liệu hợp đồng. Các trường không bắt buộc có thể bỏ trống."
        breadcrumb="Admin / Import"
        actions={
          <Button
            variant="secondary"
            leftIcon={<DownloadIcon className="w-4 h-4" />}
            onClick={handleDownloadTemplate}
          >
            Tải Template
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-2">
          <ContentCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-zinc-800 mb-4">Upload File Excel</h3>

              {/* Drop Zone */}
              <div
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                  ${isDragging
                    ? "border-[#c89968] bg-[#c89968]/5"
                    : selectedFile
                      ? "border-green-400 bg-green-50"
                      : "border-zinc-300 hover:border-[#c89968]/50 hover:bg-[#c89968]/5"
                  }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileSelect}
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                      <FileSpreadsheetIcon className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-800">{selectedFile.name}</p>
                      <p className="text-sm text-zinc-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFile}
                      leftIcon={<XIcon className="w-4 h-4" />}
                    >
                      Xóa file
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#c89968]/10 flex items-center justify-center">
                        <UploadIcon className="w-7 h-7 text-[#c89968]" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-800">
                          Kéo thả file Excel vào đây
                        </p>
                        <p className="text-sm text-zinc-500 mt-1">
                          hoặc{" "}
                          <span className="text-[#c89968] font-medium hover:underline">
                            chọn file
                          </span>
                        </p>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2">
                        Hỗ trợ: .xlsx, .xls
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <XCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Upload Button */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  leftIcon={
                    isUploading ? (
                      <LoaderIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <UploadIcon className="w-4 h-4" />
                    )
                  }
                >
                  {isUploading ? "Đang upload..." : "Upload & Import"}
                </Button>
              </div>
            </div>
          </ContentCard>
        </div>

        {/* Instructions */}
        <div>
          <ContentCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-zinc-800 mb-4">Hướng dẫn</h3>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#c89968] text-white flex items-center justify-center text-sm font-semibold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-zinc-800">Tải template</p>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      Tải file Excel mẫu về máy
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#c89968] text-white flex items-center justify-center text-sm font-semibold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-zinc-800">Điền dữ liệu</p>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      Nhập thông tin vào các cột trong file
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#c89968] text-white flex items-center justify-center text-sm font-semibold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-zinc-800">Upload file</p>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      Kéo thả hoặc chọn file đã chuẩn bị
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-200">
                <h4 className="font-medium text-zinc-700 mb-2">Lưu ý:</h4>
                <ul className="text-sm text-zinc-500 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">*</span>
                    Số hợp đồng và Năm là bắt buộc
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">!</span>
                    Các trường khác tùy chọn
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">i</span>
                    Hợp đồng trùng sẽ được cập nhật
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">i</span>
                    Định dạng ngày: DD/MM/YYYY
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Lĩnh vực:</strong> karaoke, cafe, nha_hang, khach_san
                </p>
              </div>
            </div>
          </ContentCard>
        </div>
      </div>

      {/* Result Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="Kết quả Import"
      >
        <div className="p-6">
          {importResult && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle2Icon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">
                    {importResult.success_count}
                  </p>
                  <p className="text-sm text-green-600">Thành công</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <XCircleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-700">
                    {importResult.error_count}
                  </p>
                  <p className="text-sm text-red-600">Lỗi</p>
                </div>
                <div className="text-center p-4 bg-zinc-100 rounded-lg">
                  <FileIcon className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-zinc-700">
                    {importResult.total_rows}
                  </p>
                  <p className="text-sm text-zinc-600">Tổng dòng</p>
                </div>
              </div>

              {/* Errors List */}
              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-zinc-700 mb-2">Chi tiết lỗi:</h4>
                  <div className="max-h-60 overflow-y-auto border border-red-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-red-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium">Dòng</th>
                          <th className="text-left p-2 font-medium">Lỗi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.errors.map((err, idx) => (
                          <tr key={idx} className="border-t border-red-100">
                            <td className="p-2 font-mono">{err.row}</td>
                            <td className="p-2 text-red-700">
                              <ul className="list-disc list-inside">
                                {err.errors.map((e, i) => (
                                  <li key={i}>{e}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowResultModal(false)}
                >
                  Đóng
                </Button>
                <Button
                  onClick={() => {
                    setShowResultModal(false);
                    clearFile();
                    setImportResult(null);
                  }}
                >
                  Import thêm
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Page>
  );
}
