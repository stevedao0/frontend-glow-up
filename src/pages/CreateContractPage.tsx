/**
 * PHASE KVC-01: KVC Usage Locations Model/UI Refinement
 *
 * Create Contract page with new architecture:
 * - Section 1: Thông tin chung (Common contract/customer/company info - shared)
 * - Section 2: Lĩnh vực (Domain selector)
 * - Section 3: Khu vực kinh doanh (Business usage locations)
 * - Section 4: Tiền bản quyền (Multiple calculation lines)
 * - Section 5: Tạo hợp đồng (Official workflow)
 */

import React, { useMemo, useState } from 'react';
import { XIcon, CalculatorIcon, InfoIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { Page, PageHeader } from '../components/app-ui/Page';
import { FormSection } from '../components/app-ui/FormSection';
import { FieldGrid } from '../components/app-ui/FieldGrid';
import { Input } from '../components/app-ui/Input';
import { Textarea } from '../components/app-ui/Textarea';
import { Select } from '../components/app-ui/Select';
import { Button } from '../components/app-ui/Button';
import { ContractNumberPreview } from '../components/app-ui/ContractNumberPreview';
import { StepIndicator } from '../components/app-ui/StepIndicator';
import { WordLikeRoyaltyTable, formatVnd } from '../components/contract/WordLikeRoyaltyTable';
import type { RoyaltyTableData } from '../components/contract/WordLikeRoyaltyTable';
import { MusicUsageAreaSection } from '../components/contract/MusicUsageAreaSection';
import { SimpleRoyaltyInput } from '../components/contract/SimpleRoyaltyInput';
import { ContractTemplateSearch } from '../components/contract/ContractTemplateSearch';
import type { PrefillSourceResponse } from '../lib/contractsClient';
import {
  AREA_USAGE_KIND_OPTIONS,
  AVAILABLE_CALCULATION_MODULES,
  CALC_MODULE_NOT_IMPLEMENTED_PLACEHOLDER,
  CALCULATION_MODULE_OPTIONS,
  CREATE_CONTRACT_AREA_OPTIONS,
  CREATE_CONTRACT_ASSIGNEE_EMAILS,
  CREATE_CONTRACT_ASSIGNEE_OPTIONS,
  CREATE_CONTRACT_BACKGROUND_DOMAIN_OPTIONS,
  CREATE_CONTRACT_KARAOKE_USAGE_OPTIONS,
  CREATE_CONTRACT_PRICING_RENDER_OPTIONS,
  CREATE_CONTRACT_REGION_OPTIONS,
  CREATE_CONTRACT_RENEWAL_OPTIONS,
  CONTRACT_YEAR_OPTIONS,
  CREATE_CONTRACT_AREA_GROUP_OPTIONS,
  DOMAIN_NOT_IMPLEMENTED_PLACEHOLDER,
  DOMAIN_PLACEHOLDER_ONLY_PLACEHOLDER,
  getModulesByDomainFamily,
  getDomainFamilyFromDomainCode,
  isModuleCompatibleWithDomain,
} from '../data/createContractOptions';
import { RouteKey } from '../data/routes';
import {
  composeContractNo,
  CONTRACT_CREATE_DB_TARGET_HINTS,
  createCalculationLine,
  createDefaultBusinessLocation,
  createDefaultContractDraft,
  createDraftFromContract,
  DEFAULT_BASE_SALARY_VND,
  DEFAULT_GTGT_PERCENT,
  getAreaGroupOptions,
  getCanonicalFieldCode,
  getDomainDisplayName,
  getEffectiveDisplayMode,
  getKvcPricingModeLabel,
  getModuleDisplayName,
  getMusicUsageTypeLabel,
  isAreaBasedDomain,
  isFullyImplementedDomain,
  isKaraokeCalcDomain,
  isModuleAvailable,
  isPlaceholderOnlyDomain,
  mapDraftToContractRecordsCandidate,
  mapDraftToKaraokeCalcInput,
  mapKaraokeResponseToLineResult,
  mapKvcResponseToLineResult,
  mapKvcNd17ResponseToLineResult,
  mapLineInputToKaraokeCalc,
  removeCalculationLineById,
  toggleCalculationLineEnabled,
  updateCalculationLineById,
  addCalculationLine,
  aggregateCalculationLines,
  buildFullAddressFromParts,
  syncUsageFromLegal,
} from '../lib/contractCreateMapper';
import type {
  BackgroundDomainCode,
  BusinessLocationInfo,
  CalculationAggregation,
  CalculationLineInput,
  CalculationModuleCode,
  CreateContractDraft,
  CreateContractRenewalStatus,
  CustomerInfo,
  KaraokeCalculationResult,
  RoyaltyCalculationLine,
} from '../lib/contractCreateTypes';
import {
  buildFullAddress,
} from '../lib/contractCreateTypes';
import {
  getBlockingValidationErrors,
  getWarningIssues,
  isRealAddressValue,
  validateContractDraft,
  validateKaraokeCalcInput,
} from '../lib/contractCreateValidation';
import { useAuth } from '../lib/auth';
import {
  calculateKaraokeDryRun,
  calculateKvcNd17,
  calculateKvcVcpmcTariff,
  simpleCreateContract,
  createAndExportDocx,
  checkContractNoAvailability,
  downloadDocxFile,
  triggerFileDownload,
  type CreateAndExportDocxResponse,
  type SimpleCreateContractResponse,
} from '../lib/contractsClient';

const TOKEN_KEY = 'vcpmc_new_app_access_token';
const ROOM_SECTION_PRESETS = [
  { value: 'TRET', label: 'Trệt', key: 'Trệt' },
  { value: 'LUNG', label: 'Lửng', key: 'Lửng' },
  ...Array.from({ length: 10 }, (_, index) => {
    const floor = index + 1;
    return { value: `LAU_${floor}`, label: `Lầu ${floor}`, key: `Lầu ${floor}` };
  }),
  { value: 'SAN_VUON', label: 'Sân vườn', key: 'Sân vườn' },
  { value: 'KHAC', label: 'Khác', key: '' },
] as const;

const ROOM_SECTION_OPTIONS = ROOM_SECTION_PRESETS.map(({ value, label }) => ({
  value,
  label,
}));

const getRoomSectionPresetValue = (key: string) =>
  ROOM_SECTION_PRESETS.find((preset) => preset.key && preset.key === key)?.value ?? 'KHAC';

const getRoomSectionKeyFromPreset = (value: string) =>
  ROOM_SECTION_PRESETS.find((preset) => preset.value === value)?.key ?? '';

/**
 * Map calculation line result to RoyaltyTableData for WordLikeRoyaltyTable
 */
function mapCalculationLineToRoyaltyTable(
  line: {
    label: string;
    calculationModule: string;
    input: Record<string, unknown>;
    result: {
      termMonths: number;
      subtotalBeforeGtgt: number;
      gtgtAmount: number;
      totalAmount: number;
      effectiveTotalAmount?: number;
      detailRows: Array<{ label: string; value: number; formula?: string; coefficient?: number }>;
    };
  },
  options?: { totalSubjectText?: string; supportYear?: string }
): RoyaltyTableData {
  const input = line.input as Record<string, unknown>;
  const result = line.result;

  // Build fee lines from detail rows
  const feeLines = result.detailRows.map((row) => ({
    label: row.label,
    baseAmount: input.baseSalary as number || (row.coefficient ? (row.value / (row.coefficient * (input.totalRooms as number || 1))) : row.value),
    coefficient: row.coefficient,
    unitLabel: 'phòng/năm',
    quantity: input.totalRooms as number || 0,
    amount: row.value,
  }));

  // Calculate support
  const supportRate = (input.annualSupportPercent as number) || 0;
  const subtotalBeforeSupport = feeLines.reduce((sum, f) => sum + f.amount, 0);
  const supportAmount = (supportRate / 100) * subtotalBeforeSupport;
  const subtotalAfterSupport = subtotalBeforeSupport - supportAmount;

  // Get GTGT rate and calculate
  const gtgtRate = (input.gtgtPercent as number) || 8;
  const gtgtAmount = Math.round((subtotalAfterSupport * gtgtRate) / 100);

  return {
    subjectLabel: 'phòng Karaoke',
    subjectQuantityText: options?.totalSubjectText || `${input.totalRooms || 0} phòng`,
    formulaText: '(Số tiền bản quyền chi trả (tính theo năm) = Mức lương cơ sở x Hệ số điều chỉnh)',
    lines: feeLines,
    summary: {
      subtotalBeforeSupport,
      supportRate: supportRate > 0 ? supportRate : undefined,
      supportAmount: supportAmount > 0 ? supportAmount : undefined,
      subtotalAfterSupport,
      vatRate: gtgtRate,
      vatAmount: result.gtgtAmount || gtgtAmount,
      totalAmount: result.totalAmount,
      supportYear: options?.supportYear || '2026',
    },
    baseSalary: input.baseSalary as number,
    legalNoteYear: options?.supportYear || '2026',
  };
}

export function CreateContractPage({
  onNavigate,
  onOpenCreatedContract,
  initialDraftFromContract,
}: {
  onNavigate: (k: RouteKey) => void;
  onOpenCreatedContract?: (id: number) => void;
  /** Optional initial draft data from the latest contract */
  initialDraftFromContract?: import('../data/contractRecords').ContractRecord;
}) {
  const { currentUser } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [draft, setDraft] = useState<CreateContractDraft>(() => {
    const baseDraft = initialDraftFromContract
      ? createDraftFromContract(initialDraftFromContract)
      : createDefaultContractDraft();
    // Auto-fill assignee from logged-in user
    if (currentUser) {
      baseDraft.assignee = {
        name: currentUser.full_name || currentUser.email || '',
        email: currentUser.email || '',
      };
    }
    // Default signedDate to today if not set
    if (!baseDraft.common.signedDate) {
      baseDraft.common.signedDate = today;
    }
    return baseDraft;
  });
  const [isDirty, setIsDirty] = useState(false);
  const [roomSectionPresetToAdd, setRoomSectionPresetToAdd] = useState('');

  // Template source tracking (Phase TEMPLATE-CREATE-01)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedTemplateNo, setSelectedTemplateNo] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [formEditedAfterPrefill, setFormEditedAfterPrefill] = useState(false);

  // Dry-run state
  // Karaoke calculation state (legacy single calc - kept for backward compatibility)
  const [isCalcLoading, setIsCalcLoading] = useState(false);
  const [calcResult, setCalcResult] =
    useState<KaraokeCalculationResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Calculation lines state
  const [isLineCalcLoading, setIsLineCalcLoading] = useState<Record<string, boolean>>({});
  const [lineCalcErrors, setLineCalcErrors] = useState<Record<string, string | null>>({});

  // Derived: calculate aggregation from lines
  const calcLinesAggregation = useMemo<CalculationAggregation>(() => {
    return aggregateCalculationLines(draft.calculationLines, 12);
  }, [draft.calculationLines]);

  // Official create state
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [createResult, setCreateResult] =
    useState<CreateAndExportDocxResponse | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [docxDownloadSuccess, setDocxDownloadSuccess] = useState(false);

  // Availability check state
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityCheck, setAvailabilityCheck] = useState<{
    available: boolean | null;
    contract_no: string;
    existing_contract_id: number | null;
    suggested_next: string | null;
    message: string;
  } | null>(null);

  // Derived values
  const contractNoPreview = useMemo(() => composeContractNo(draft), [draft]);
  const candidatePayload = useMemo(
    () => mapDraftToContractRecordsCandidate(draft, calcLinesAggregation),
    [draft, calcLinesAggregation]
  );
  const validationIssues = useMemo(() => validateContractDraft(draft), [draft]);
  const blockingErrors = useMemo(
    () => getBlockingValidationErrors(validationIssues),
    [validationIssues]
  );
  const warningIssues = useMemo(
    () => getWarningIssues(validationIssues),
    [validationIssues]
  );

  const isKaraokeDomain = isKaraokeCalcDomain(draft.domain.domainCode);
  const isAreaBasedDomainFlag = isAreaBasedDomain(draft.domain.domainCode);
  const isPlaceholderOnlyDomainFlag = isPlaceholderOnlyDomain(draft.domain.domainCode);
  const isImplementedDomain = isFullyImplementedDomain(draft.domain.domainCode);
  const domainFamily = getDomainFamilyFromDomainCode(draft.domain.domainCode);
  const filteredModules = useMemo(
    () => getModulesByDomainFamily(domainFamily),
    [domainFamily]
  );
  const canCreateContract =
    !isCreateLoading;
  const createdContractId =
    typeof createResult?.contract_id === 'number'
      ? createResult.contract_id
      : null;

  // =========================================================================
  // UPDATE HANDLERS
  // =========================================================================

  const updateDraft = (
    updater: (current: CreateContractDraft) => CreateContractDraft
  ) => {
    setDraft((current) => updater(current));
    setIsDirty(true);
    setCreateResult(null);
    setCreateError(null);
    setCalcResult(null);
    setDocxDownloadSuccess(false);
    // Clear availability check when any field changes
    setAvailabilityCheck(null);
    // Track if user edited form after prefill (for template change warning)
    if (selectedTemplateId) {
      setFormEditedAfterPrefill(true);
    }
  };

  // =============================================================================
  // TEMPLATE HANDLERS (Phase TEMPLATE-CREATE-01)
  // =============================================================================

  const handleTemplateSelected = (contractId: number, contractNo: string) => {
    setSelectedTemplateId(contractId);
    setSelectedTemplateNo(contractNo);
    setFormEditedAfterPrefill(false);
  };

  const handleTemplateCleared = () => {
    setSelectedTemplateId(null);
    setSelectedTemplateNo('');
    setSelectedTemplateName('');
    setFormEditedAfterPrefill(false);
    // Clear template references from draft but keep form data
    updateDraft((current) => ({
      ...current,
      domain: {
        ...current.domain,
        sourceTemplateContractId: null,
        sourceTemplateContractNo: '',
      },
    }));
  };

  const handlePrefillData = (prefillData: PrefillSourceResponse) => {
    console.log('[CreateContract] handlePrefillData called with:', prefillData);

    // Extract domain code from string
    const domainCodeMap: Record<string, import('../lib/contractCreateTypes').BackgroundDomainCode> = {
      'KARAOKE': 'KARAOKE',
      'PHONG_THU_AM': 'PHONG_THU_AM',
      'CAFE': 'CAFE',
      'NHA_HANG': 'NHA_HANG',
      'KHU_VUI_CHOI': 'KHU_VUI_CHOI',
      'KHACH_SAN': 'KHACH_SAN',
      'SIEU_THI': 'SIEU_THI',
      'TRUNG_TAM_THUONG_MAI': 'TRUNG_TAM_THUONG_MAI',
      'BAR': 'BAR',
      'VAN_PHONG': 'VAN_PHONG',
      'CUA_HANG': 'CUA_HANG',
      'RAP_CHIEU': 'RAP_CHIEU',
      'PHONG_TRA': 'PHONG_TRA',
      'CHAM_SOC_SUC_KHOE': 'CHAM_SOC_SUC_KHOE',
    };
    const domainCode = prefillData.domain_code
      ? (domainCodeMap[prefillData.domain_code.toUpperCase()] || prefillData.domain_code as any)
      : prefillData.domain_code;

    // Parse room sections from prefill data
    const roomSections = (prefillData.room_sections || []).map((section: any) => ({
      key: section.key || '',
      roomCount: section.room_count || section.roomCount || 0,
      roomNames: section.room_names_text || section.roomNames || '',
    }));

    // ================================================================
    // NORMALIZE PREFILL DATA (Frontend Safety Layer)
    // ================================================================

    // Address normalization with strict validation
    // Filter out placeholder/key strings (e.g., "don_vi_dia_chi", "{{...}}", "__...__")
    let legalFullAddress = isRealAddressValue(prefillData.legal_full_address)
      ? prefillData.legal_full_address
      : null;
    let usageFullAddress = isRealAddressValue(prefillData.usage_full_address)
      ? prefillData.usage_full_address
      : null;
    let legalAddressLine = isRealAddressValue(prefillData.legal_address_line)
      ? prefillData.legal_address_line
      : null;
    let usageAddressLine = isRealAddressValue(prefillData.usage_address_line)
      ? prefillData.usage_address_line
      : null;

    // If legal_full_address is missing but legal_address_line has data, use it
    if (!legalFullAddress && legalAddressLine) {
      legalFullAddress = legalAddressLine;
    }

    // If legal_address_line is missing but legal_full_address has data, use it
    if (!legalAddressLine && legalFullAddress) {
      legalAddressLine = legalFullAddress;
    }

    // If usage_full_address is missing but usage_address_line has data, use it
    if (!usageFullAddress && usageAddressLine) {
      usageFullAddress = usageAddressLine;
    }

    // If usage_address_line is missing but usage_full_address has data, use it
    if (!usageAddressLine && usageFullAddress) {
      usageAddressLine = usageFullAddress;
    }

    // Legal address fallback: if no real legal address, use usage_full_address
    if (!legalFullAddress && usageFullAddress) {
      legalFullAddress = usageFullAddress;
      legalAddressLine = usageAddressLine;
      console.log('[template-search] WARNING: No real legal address found; using usage_full_address fallback');
    }

    // Determine usage_same_as_legal
    let usageSameAsLegal = prefillData.usage_same_as_legal ?? true;
    if (usageSameAsLegal === undefined || usageSameAsLegal === null) {
      usageSameAsLegal = !usageFullAddress || (legalFullAddress && usageFullAddress === legalFullAddress);
    }

    // Parse music usage areas
    let musicUsageAreas = (prefillData.music_usage_areas || []).map((area: any, idx: number) => ({
      id: `area-${idx}`,
      areaName: area.area_name || area.areaName || '',
      scaleDescription: area.scale_description || area.scaleDescription || '',
      musicUsageType: area.music_usage_type || area.musicUsageType || 'NHAC_NEN',
    }));

    // Music usage areas fallback: generate from room_sections/total_rooms
    let generatedFromRoomSections = false;
    if (musicUsageAreas.length === 0 && (prefillData.total_rooms || roomSections.length > 0)) {
      const totalRooms = prefillData.total_rooms || 0;
      let scaleDescription = '';

      if (totalRooms > 0) {
        scaleDescription = `${totalRooms} phòng`;
      } else if (roomSections.length > 0) {
        // Calculate total from room sections
        const calculatedTotal = roomSections.reduce((sum, s) => sum + (s.roomCount || 0), 0);
        if (calculatedTotal > 0) {
          scaleDescription = `${calculatedTotal} phòng`;
        } else {
          scaleDescription = 'Theo thông tin hợp đồng cũ';
        }
      } else {
        scaleDescription = 'Theo thông tin hợp đồng cũ';
      }

      musicUsageAreas = [{
        id: 'area-0',
        areaName: 'Phòng Karaoke',
        scaleDescription: scaleDescription,
        musicUsageType: 'KARAOKE',
      }];
      generatedFromRoomSections = true;
    }

    // Check if it's a karaoke domain
    const isKaraokeDomain = ['KARAOKE', 'PHONG_THU_AM'].includes(prefillData.domain_code || '');

    // Log normalized data
    console.log('[template-search] Prefill normalized:', {
      legal_full_address: legalFullAddress,
      usage_full_address: usageFullAddress,
      music_usage_areas_count: musicUsageAreas.length,
      generated_from_room_sections: generatedFromRoomSections,
    });

    updateDraft((current) => {
      // Track old template ID for logging
      const oldTemplateId = current.domain.sourceTemplateContractId;

      // Start with default draft to ensure all required fields exist
      // This prevents undefined crashes when components call .filter() on arrays
      const baseDraft = createDefaultContractDraft();

      // Build safe prefill data (ensure arrays)
      const safeMusicUsageAreas = Array.isArray(musicUsageAreas) ? musicUsageAreas : [];
      const safeRoomSections = Array.isArray(roomSections) ? roomSections : [];

      // Keep user-input fields
      const userInputContractNumber = current.common.contractNumber;
      const userInputSignedDate = current.common.signedDate;
      const userInputEffectiveFrom = current.term.effectiveFrom;
      const userInputEffectiveTo = current.term.effectiveTo;

      const newDraft: CreateContractDraft = {
        // Merge base draft first (ensures all fields exist)
        ...baseDraft,

        // Override with business data from template
        customer: {
          ...baseDraft.customer,
          legalName: prefillData.legal_name || '',
          brandName: prefillData.brand_name || '',
          representativeName: prefillData.representative_name || '',
          representativeTitle: prefillData.representative_title || '',
          taxCode: prefillData.tax_code || '',
          cccd: prefillData.cccd || '',
          phone: prefillData.phone || '',
          email: prefillData.email || '',
          legalAddressLine: legalAddressLine || '',
          legalWard: prefillData.legal_ward || '',
          legalProvince: prefillData.legal_province || '',
          legalFullAddress: legalFullAddress || '',
          legalAddress: legalFullAddress || '',
        },
        location: {
          ...baseDraft.location,
          usageSameAsLegal: usageSameAsLegal,
          usageAddressLine: usageAddressLine || '',
          usageWard: prefillData.usage_ward || '',
          usageProvince: prefillData.usage_province || '',
          usageFullAddress: usageFullAddress || '',
          usageAddress: usageFullAddress || '',
        },
        domain: {
          ...baseDraft.domain,
          domainGroup: prefillData.domain_group || 'background',
          domainCode: (domainCode as any) || 'KARAOKE',
          domainDisplayName: prefillData.domain_display_name || prefillData.domain_code || 'Karaoke',
          fieldCode: prefillData.field_code || '',
          renewalStatus: 'NEW',
          referenceContractId: null,
          referenceContractNo: '',
          sourceTemplateContractId: prefillData.contract_id,
          sourceTemplateContractNo: prefillData.contract_no,
        },
        karaoke: isKaraokeDomain ? {
          ...baseDraft.karaoke,
          karaokeType: (prefillData.karaoke_type as 'PHONG' | 'BOX') || 'PHONG',
          totalRooms: prefillData.total_rooms || 0,
          totalBoxes: prefillData.total_boxes || 0,
          baseSalary: 2340000,
          annualSupportPercent: 0,
          tier1SupportPercent: 0,
          tier2SupportPercent: 0,
          tier3SupportPercent: 0,
          gtgtPercent: 8,
          pricingRenderMode: 'text',
          roomSections: safeRoomSections,
        } : baseDraft.karaoke,
        areaBased: {
          ...baseDraft.areaBased,
          musicUsageAreas: safeMusicUsageAreas,
          royaltyAmountBeforeVat: prefillData.royalty_amount_before_vat ?? 0,
          vatRate: prefillData.vat_rate ?? 8,
          vatAmount: prefillData.vat_amount ?? 0,
          royaltyAmountAfterVat: prefillData.royalty_amount_after_vat ?? 0,
          royaltyAmountInWords: prefillData.royalty_amount_in_words || '',
        },
        notes: {
          ...baseDraft.notes,
          contractTerms: prefillData.contract_terms_note || '',
        },
        // User input fields - never override from template
        common: {
          ...baseDraft.common,
          contractNumber: userInputContractNumber,
          signedDate: userInputSignedDate,
          contractYear: current.common.contractYear || baseDraft.common.contractYear,
          regionCode: current.common.regionCode || baseDraft.common.regionCode,
          areaCode: current.common.areaCode,
          fieldCode: current.common.fieldCode,
        },
        term: {
          ...baseDraft.term,
          effectiveFrom: userInputEffectiveFrom,
          effectiveTo: userInputEffectiveTo,
        },
        assignee: {
          ...baseDraft.assignee,
          name: current.assignee.name || baseDraft.assignee.name,
          email: current.assignee.email || baseDraft.assignee.email,
        },
      };

      // Draft shape validation logging
      console.log('[CreateContract] draft shape after prefill:', {
        template_contract_id: prefillData.contract_id,
        template_contract_no: prefillData.contract_no,
        validation: {
          calculationLines_isArray: Array.isArray(newDraft.calculationLines),
          calculationLines_length: newDraft.calculationLines?.length,
          musicUsageAreas_isArray: Array.isArray(newDraft.areaBased.musicUsageAreas),
          musicUsageAreas_length: newDraft.areaBased.musicUsageAreas?.length,
          roomSections_isArray: Array.isArray(newDraft.karaoke.roomSections),
          roomSections_length: newDraft.karaoke.roomSections?.length,
          locations_isArray: Array.isArray(newDraft.areaBased.locations),
          locations_length: newDraft.areaBased.locations?.length,
        },
        draft_legal_name: newDraft.customer.legalName,
        draft_brand_name: newDraft.customer.brandName,
        draft_legal_full_address: newDraft.customer.legalFullAddress,
        draft_usage_full_address: newDraft.location.usageFullAddress,
        draft_music_usage_areas_count: newDraft.areaBased.musicUsageAreas?.length ?? 0,
        old_template_contract_id: oldTemplateId,
        cleared_previous_template_data: true,
      });

      return newDraft;
    });

    // Update template name for display
    setSelectedTemplateName(prefillData.legal_name || '');
  };

  // Check contract number availability
  const checkAvailability = async () => {
    if (!contractNoPreview) {
      setAvailabilityCheck(null);
      return;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    setIsCheckingAvailability(true);
    try {
      const result = await checkContractNoAvailability({
        contract_no: contractNoPreview,
        short_no: draft.common.contractNumber,
        year: parseInt(draft.common.contractYear) || undefined,
        region_code: draft.common.regionCode || undefined,
        permission_code: draft.common.fieldCode || undefined,
      });
      setAvailabilityCheck({
        available: result.available,
        contract_no: result.contract_no,
        existing_contract_id: result.existing_contract_id,
        suggested_next: result.suggested_next,
        message: result.message,
      });
    } catch (error: any) {
      console.error("[contract-no-check] error:", error);
      setAvailabilityCheck(null);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const updateDomain = (code: BackgroundDomainCode) => {
    const domainFamily = getDomainFamilyFromDomainCode(code);
    updateDraft((current) => ({
      ...current,
      common: {
        ...current.common,
        fieldCode: getCanonicalFieldCode(code),
      },
      domain: {
        ...current.domain,
        domainCode: code,
        domainDisplayName: getDomainDisplayName(code),
      },
      karaoke: isKaraokeCalcDomain(code) ? current.karaoke : {
        karaokeType: 'PHONG' as const,
        areaGroup: 'DEN_20' as const,
        totalRooms: 0,
        totalBoxes: 0,
        baseSalary: DEFAULT_BASE_SALARY_VND,
        annualSupportPercent: 0,
        tier1SupportPercent: 0,
        tier2SupportPercent: 0,
        tier3SupportPercent: 0,
        gtgtPercent: DEFAULT_GTGT_PERCENT,
        pricingRenderMode: 'text' as const,
        roomSections: [],
      },
      // Keep only lines compatible with the new domain family (with guard)
      calculationLines: (current.calculationLines ?? []).filter((line) =>
        isModuleCompatibleWithDomain(line.calculationModule, code)
      ),
    }));
  };

  const updateKaraokeRoomCount = (count: number) => {
    updateDraft((current) => {
      const normalizedCount = Math.max(0, count || 0);
      const karaokeType = current.karaoke.karaokeType;
      return {
        ...current,
        karaoke: {
          ...current.karaoke,
          totalRooms: karaokeType === 'PHONG' ? normalizedCount : current.karaoke.totalRooms,
          totalBoxes: karaokeType === 'BOX' ? normalizedCount : current.karaoke.totalBoxes,
        },
        calculationLines: current.calculationLines.map((line) => {
          if (karaokeType === 'PHONG' && line.input.module === 'KARAOKE_PHONG') {
            return {
              ...line,
              input: {
                ...line.input,
                totalRooms: normalizedCount,
                areaGroup: current.karaoke.areaGroup === 'BOX' ? 'DEN_20' : current.karaoke.areaGroup,
              },
              result: null,
              status: 'idle',
            };
          }
          if (karaokeType === 'BOX' && line.input.module === 'KARAOKE_BOX') {
            return {
              ...line,
              input: {
                ...line.input,
                totalBoxes: normalizedCount,
              },
              result: null,
              status: 'idle',
            };
          }
          return line;
        }),
      };
    });
  };

  const updateKaraokeCalculationField = (
    lineId: string,
    field: string,
    value: number | string,
  ) => {
    updateDraft((current) => ({
      ...current,
      karaoke: {
        ...current.karaoke,
        ...(field === 'baseSalary' || field === 'gtgtPercent' || field === 'annualSupportPercent'
          ? { [field]: value, tier1SupportPercent: 0, tier2SupportPercent: 0, tier3SupportPercent: 0 }
          : {}),
      },
      calculationLines: current.calculationLines.map((line) =>
        line.id === lineId
          ? { ...line, input: { ...line.input, [field]: value }, result: null, status: 'idle' }
          : line
      ),
    }));
  };

  const updateRoomSection = (
    index: number,
    field: 'key' | 'roomCount' | 'roomNames',
    value: string | number
  ) => {
    updateDraft((current) => {
      const roomSections = current.karaoke.roomSections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      );
      const sectionTotal = roomSections.reduce(
        (sum, section) => sum + Math.max(0, Number(section.roomCount) || 0),
        0
      );
      const karaokeType = current.karaoke.karaokeType;

      return {
        ...current,
        karaoke: {
          ...current.karaoke,
          roomSections,
          totalRooms: karaokeType === 'PHONG' ? sectionTotal : current.karaoke.totalRooms,
          totalBoxes: karaokeType === 'BOX' ? sectionTotal : current.karaoke.totalBoxes,
        },
        calculationLines: current.calculationLines.map((line) => {
          if (karaokeType === 'PHONG' && line.input.module === 'KARAOKE_PHONG') {
            return {
              ...line,
              input: { ...line.input, totalRooms: sectionTotal },
              result: null,
              status: 'idle',
            };
          }
          if (karaokeType === 'BOX' && line.input.module === 'KARAOKE_BOX') {
            return {
              ...line,
              input: { ...line.input, totalBoxes: sectionTotal },
              result: null,
              status: 'idle',
            };
          }
          return line;
        }),
      };
    });
  };

  const addRoomSection = (presetValue: string) => {
    const key = getRoomSectionKeyFromPreset(presetValue);
    updateDraft((current) => ({
      ...current,
      karaoke: {
        ...current.karaoke,
        roomSections: [
          ...current.karaoke.roomSections,
          {
            key,
            roomCount: 0,
            roomNames: '',
          },
        ],
      },
    }));
  };

  const removeRoomSection = (index: number) => {
    updateDraft((current) => {
      const roomSections = (current.karaoke.roomSections ?? []).filter((_, i) => i !== index);
      const sectionTotal = roomSections.reduce(
        (sum, section) => sum + Math.max(0, Number(section.roomCount) || 0),
        0
      );
      const karaokeType = current.karaoke.karaokeType;

      return {
        ...current,
        karaoke: {
          ...current.karaoke,
          roomSections,
          totalRooms: karaokeType === 'PHONG' ? sectionTotal : current.karaoke.totalRooms,
          totalBoxes: karaokeType === 'BOX' ? sectionTotal : current.karaoke.totalBoxes,
        },
        calculationLines: current.calculationLines.map((line) => {
          if (karaokeType === 'PHONG' && line.input.module === 'KARAOKE_PHONG') {
            return {
              ...line,
              input: { ...line.input, totalRooms: sectionTotal },
              result: null,
              status: 'idle',
            };
          }
          if (karaokeType === 'BOX' && line.input.module === 'KARAOKE_BOX') {
            return {
              ...line,
              input: { ...line.input, totalBoxes: sectionTotal },
              result: null,
              status: 'idle',
            };
          }
          return line;
        }),
      };
    });
  };

  // =========================================================================
  // CHECKLIST & STEPS
  // =========================================================================

  const checklist = useMemo(
    () => [
      {
        label: 'Số hợp đồng hợp lệ',
        completed: !!draft.common.contractNumber && !!draft.common.contractYear,
      },
      {
        label: 'Đã có đối tác',
        completed: !!draft.customer.legalName && !!draft.customer.brandName,
      },
      {
        label: 'Đã có địa điểm',
        completed: !!draft.location.usageAddress || !!draft.customer.legalFullAddress,
      },
      {
        label: 'Đã có thời hạn',
        completed: !!draft.term.effectiveFrom && !!draft.term.effectiveTo,
      },
    ],
    [draft]
  );

  const steps = [
    { label: 'Thông tin chung', completed: checklist[0].completed && checklist[1].completed },
    { label: 'Lĩnh vực', completed: !!draft.domain.domainCode },
    { label: 'Khu vực KD', completed: true },
    { label: 'Tiền bản quyền', completed: (draft.areaBased.royaltyAmountBeforeVat ?? 0) > 0 },
    { label: 'Kiểm tra', completed: checklist.every((c) => c.completed) },
  ];

  // =========================================================================
  // KARAOKE CALCULATION HANDLER
  // =========================================================================

  const handleKaraokeCalc = async () => {
    const calcIssues = validateKaraokeCalcInput(draft);
    const blocking = calcIssues.filter((i) => i.severity === 'error');
    if (blocking.length > 0) {
      setCalcError('Vui lòng kiểm tra lại thông tin trước khi tính.');
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCalcError('Bạn cần đăng nhập trước khi tính tiền bản quyền.');
      return;
    }

    setIsCalcLoading(true);
    setCalcError(null);
    try {
      const input = mapDraftToKaraokeCalcInput(draft);
      const result = await calculateKaraokeDryRun(token, input);
      setCalcResult(result);
    } catch (error: any) {
      setCalcError(String(error?.message || 'Tính tiền thất bại.'));
    } finally {
      setIsCalcLoading(false);
    }
  };

  // =========================================================================
  // CALCULATION LINES HANDLERS
  // =========================================================================

  const handleAddCalcLine = (module: CalculationModuleCode) => {
    updateDraft((current) => {
      const allLocationIds = current.areaBased.locations.map((loc) => loc.id);
      return {
        ...current,
        calculationLines: [
          ...current.calculationLines,
          createCalculationLine(module, current.calculationLines.length, allLocationIds),
        ],
      };
    });
  };

  const handleRemoveCalcLine = (lineId: string) => {
    updateDraft((current) => ({
      ...current,
      calculationLines: (current.calculationLines ?? []).filter((line) => line.id !== lineId),
    }));
  };

  const handleToggleCalcLineEnabled = (lineId: string) => {
    updateDraft((current) => ({
      ...current,
      calculationLines: current.calculationLines.map((line) =>
        line.id === lineId ? { ...line, enabled: !line.enabled } : line
      ),
    }));
  };

  const handleUpdateCalcLineLabel = (lineId: string, label: string) => {
    updateDraft((current) => ({
      ...current,
      calculationLines: current.calculationLines.map((line) =>
        line.id === lineId ? { ...line, label } : line
      ),
    }));
  };

  const handleUpdateCalcLineModule = (lineId: string, module: CalculationModuleCode) => {
    updateDraft((current) => {
      const allLocationIds = current.areaBased.locations.map((loc) => loc.id);
      return {
        ...current,
        calculationLines: current.calculationLines.map((line) => {
          if (line.id !== lineId) return line;
          const newLine = createCalculationLine(module, current.calculationLines.length, allLocationIds);
          return {
            ...newLine,
            id: lineId,
            label: line.label || newLine.label,
            enabled: line.enabled,
          };
        }),
      };
    });
  };

  const handleUpdateLineInput = (lineId: string, input: RoyaltyCalculationLine['input']) => {
    updateDraft((current) => ({
      ...current,
      calculationLines: current.calculationLines.map((line) =>
        line.id === lineId ? { ...line, input } : line
      ),
    }));
  };

  const handleCalculateLine = async (lineId: string) => {
    const line = draft.calculationLines.find((l) => l.id === lineId);
    if (!line) return;

    if (!isModuleAvailable(line.calculationModule)) {
      setLineCalcErrors((prev) => ({ ...prev, [lineId]: 'Module này chưa triển khai.' }));
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLineCalcErrors((prev) => ({ ...prev, [lineId]: 'Bạn cần đăng nhập.' }));
      return;
    }

    setIsLineCalcLoading((prev) => ({ ...prev, [lineId]: true }));
    setLineCalcErrors((prev) => ({ ...prev, [lineId]: null }));

    try {
      if (line.calculationModule === 'KARAOKE_PHONG' || line.calculationModule === 'KARAOKE_BOX') {
        const calcInput = mapLineInputToKaraokeCalc(
          line.input.module === 'KARAOKE_PHONG'
            ? {
                ...line.input,
                areaGroup: draft.karaoke.areaGroup === 'BOX' ? 'DEN_20' : draft.karaoke.areaGroup,
                totalRooms: draft.karaoke.totalRooms,
              }
            : line.input.module === 'KARAOKE_BOX'
              ? {
                  ...line.input,
                  totalBoxes: draft.karaoke.totalBoxes,
                }
              : line.input,
          composeContractNo(draft),
          draft.term.effectiveFrom,
          draft.term.effectiveTo,
          draft.karaoke.pricingRenderMode,
          draft.karaoke.roomSections
        );

        if (!calcInput) {
          throw new Error('Không thể tạo input cho module này.');
        }

        const response = await calculateKaraokeDryRun(token, calcInput);
        const lineResult = mapKaraokeResponseToLineResult(response);

        updateDraft((current) => ({
          ...current,
          calculationLines: current.calculationLines.map((l) =>
            l.id === lineId
              ? {
                  ...l,
                  result: lineResult,
                  status: response.ok ? 'success' : 'error',
                  errors: response.errors.map((e) => ({ field: e.field, message: e.message })),
                  warnings: response.warnings.map((w) => ({ field: w.field, message: w.message })),
                }
              : l
          ),
        }));
      } else if (line.calculationModule === 'KVC_VCPMC_TARIFF') {
        // PHASE KVC-02b: Backend is source of truth
        const locations = (draft.areaBased.locations ?? [])
          .filter((loc) => line.appliesToLocationIds.includes(loc.id))
          .map((loc) => ({
            id: loc.id,
            name: loc.locationName || loc.businessAddress || loc.id,
            area_m2: loc.musicUsageAreaM2 || 0,
          }));

        const calcInput = {
          locations,
          gtgt_percent: (line.input as any).gtgtPercent ?? 8.0,
          support_percent: (line.input as any).supportPercent ?? 0.0,
          support_amount: (line.input as any).supportAmount ?? 0,
          support_note: (line.input as any).supportNote ?? '',
        };

        const response = await calculateKvcVcpmcTariff(token, calcInput);
        const lineResult = mapKvcResponseToLineResult(response);

        updateDraft((current) => ({
          ...current,
          calculationLines: current.calculationLines.map((l) =>
            l.id === lineId
              ? {
                  ...l,
                  result: lineResult,
                  status: response.ok ? 'success' : 'error',
                  errors: response.errors.map((e) => ({ field: e.field, message: e.message })),
                  warnings: response.warnings.map((w) => ({ field: w.field, message: w.message })),
                }
              : l
          ),
        }));
      } else if (line.calculationModule === 'KVC_ND17') {
        // PHASE KVC-05: ND17 calculation
        const locations = (draft.areaBased.locations ?? [])
          .filter((loc) => line.appliesToLocationIds.includes(loc.id))
          .map((loc) => ({
            id: loc.id,
            name: loc.locationName || loc.businessAddress || loc.id,
            area_m2: loc.musicUsageAreaM2 || 0,
          }));

        const calcInput = {
          locations,
          base_salary: (line.input as any).baseSalary ?? 2_340_000,
          urban_class: (line.input as any).urbanClass,
          gtgt_percent: (line.input as any).gtgtPercent ?? 8.0,
          support_percent: (line.input as any).supportPercent ?? 0.0,
          support_amount: (line.input as any).supportAmount ?? 0,
          support_note: (line.input as any).supportNote ?? '',
          include_premise_services: (line.input as any).includePremiseServices ?? false,
          premise_services_note: (line.input as any).premiseServicesNote ?? '',
        };

        const response = await calculateKvcNd17(token, calcInput);
        const lineResult = mapKvcNd17ResponseToLineResult(response);

        updateDraft((current) => ({
          ...current,
          calculationLines: current.calculationLines.map((l) =>
            l.id === lineId
              ? {
                  ...l,
                  result: lineResult,
                  status: response.ok ? 'success' : 'error',
                  errors: response.errors.map((e) => ({ field: e.field, message: e.message })),
                  warnings: response.warnings.map((w) => ({ field: w.field, message: w.message })),
                }
              : l
          ),
        }));
      } else if (['CAFE', 'NHA_HANG', 'KHACH_SAN', 'MANUAL_FEE'].includes(line.calculationModule)) {
        // Manual fee modules - compute result locally from user input
        const tienChuaGtgt = (line.input as any).tienChuaGtgt ?? 0;
        const gtgtPercent = (line.input as any).gtgtPercent ?? 8;
        const gtgtAmount = Math.round(tienChuaGtgt * gtgtPercent / 100);
        const tienSauThue = tienChuaGtgt + gtgtAmount;

        const termFrom = draft.term.effectiveFrom ? new Date(draft.term.effectiveFrom) : null;
        const termTo = draft.term.effectiveTo ? new Date(draft.term.effectiveTo) : null;
        let termMonths = 12;
        if (termFrom && termTo) {
          const months = (termTo.getFullYear() - termFrom.getFullYear()) * 12 + (termTo.getMonth() - termFrom.getMonth());
          termMonths = Math.max(1, Math.min(12, months));
        }

        const manualLineResult = {
          termMonths,
          subtotalBeforeGtgt: tienChuaGtgt,
          gtgtAmount,
          totalAmount: tienSauThue,
          effectiveSubtotalBeforeGtgt: tienChuaGtgt,
          effectiveTotalAmount: tienSauThue,
          detailRows: [
            { label: 'Tiền chưa thuế GTGT', value: tienChuaGtgt },
            { label: `Thuế GTGT (${gtgtPercent}%)`, value: gtgtAmount },
          ],
          warnings: [] as { field: string; message: string; severity: string }[],
          errors: [] as { field: string; message: string }[],
          docxContextPreview: {} as Record<string, string>,
        };

        updateDraft((current) => ({
          ...current,
          calculationLines: current.calculationLines.map((l) =>
            l.id === lineId
              ? {
                  ...l,
                  result: manualLineResult,
                  status: 'success' as const,
                  errors: [],
                  warnings: [],
                }
              : l
          ),
        }));
      } else {
        // Module not implemented yet
        setLineCalcErrors((prev) => ({ ...prev, [lineId]: CALC_MODULE_NOT_IMPLEMENTED_PLACEHOLDER }));
      }
    } catch (error: any) {
      setLineCalcErrors((prev) => ({ ...prev, [lineId]: String(error?.message || 'Tính thử thất bại.') }));
      updateDraft((current) => ({
        ...current,
        calculationLines: current.calculationLines.map((l) =>
          l.id === lineId
            ? { ...l, status: 'error' as const, result: null }
            : l
        ),
      }));
    } finally {
      setIsLineCalcLoading((prev) => ({ ...prev, [lineId]: false }));
    }
  };

  // =========================================================================
  // OFFICIAL CREATE + DOWNLOAD HANDLER
  // =========================================================================

  const handleCreateContract = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCreateError('Bạn cần đăng nhập trước khi tạo hợp đồng.');
      return;
    }
    if (!canCreateContract) {
      setCreateError('Vui lòng điền đầy đủ thông tin hợp đồng trước khi tạo.');
      return;
    }

    // If we already know it's unavailable, warn user
    if (availabilityCheck && !availabilityCheck.available) {
      setCreateError(`${availabilityCheck.message} (${availabilityCheck.contract_no})`);
      return;
    }

    setIsCreateLoading(true);
    setCreateError(null);
    setCreateResult(null);

    console.log("[create-contract] submitting", {
      contract_no: candidatePayload.contract_no,
      contract_year: candidatePayload.contract_year,
      region_code: candidatePayload.region_code,
      field_code: candidatePayload.field_code,
    });

    try {
      const result = await createAndExportDocx(token, {
        draft,
        client_preflight: candidatePayload,
      });
      setCreateResult(result);
      console.log("[create-contract] result", {
        ok: result.ok,
        mode: result.mode,
        error_code: result.error_code,
        contract_no: result.contract_no,
        message: result.message,
      });
      if (!result.ok) {
        // Build detailed error message
        let errorMsg = result.message || 'Tạo hợp đồng thất bại.';
        if (result.contract_no) {
          errorMsg = `${errorMsg} (${result.contract_no})`;
        }
        if (result.suggested_next) {
          errorMsg = `${errorMsg} Gợi ý: ${result.suggested_next}`;
        }
        setCreateError(errorMsg);
      } else {
        // Show success state first
        setCreateResult(result);
        
        // Try to download DOCX - with retry for 'created_no_docx' mode
        // Phase BACKGROUND-TEMPLATE-REFACTOR: Pass template_code to download
        const tryDownloadDocx = async () => {
          if (!result.contract_id) return;
          
          setDocxDownloadSuccess(false);
          try {
            const blob = await downloadDocxFile(token, result.contract_id, draft.contractTemplateCode);
            const safeName = (result.contract_no || `contract_${result.contract_id}`)
              .replace(/\//g, '_').replace(/\\/g, '_');
            triggerFileDownload(blob, `${safeName}.docx`);
            setDocxDownloadSuccess(true);
          } catch (downloadError: any) {
            // If skipped initially, try one more time after a delay
            if (result.mode === 'created_no_docx' || result.docx_export_skipped) {
              console.warn('First download attempt failed, retrying...', downloadError);
              try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const blobRetry = await downloadDocxFile(token, result.contract_id, draft.contractTemplateCode);
                const safeName = (result.contract_no || `contract_${result.contract_id}`)
                  .replace(/\//g, '_').replace(/\\/g, '_');
                triggerFileDownload(blobRetry, `${safeName}.docx`);
                setDocxDownloadSuccess(true);
              } catch (retryError: any) {
                console.error('DOCX download retry failed:', retryError);
                setDocxDownloadSuccess(false);
              }
            } else {
              console.error('DOCX download failed:', downloadError);
              setDocxDownloadSuccess(false);
            }
          }
        };
        
        tryDownloadDocx();
      }
    } catch (error: any) {
      setCreateError(String(error?.message || 'Tạo hợp đồng thất bại.'));
    } finally {
      setIsCreateLoading(false);
    }
  };

  // =========================================================================
  // LOCAL ACTIONS
  // =========================================================================

  const handleSaveDraft = () => {
    console.log('Local create draft only:', draft);
    setIsDirty(false);
  };

  const handleCancel = () => {
    if (isDirty) {
      if (
        confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy và quay lại?')
      ) {
        onNavigate('contracts.list');
      }
    } else {
      onNavigate('contracts.list');
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <Page>
      <PageHeader
        breadcrumb="/bg/contracts/new"
        title="Tạo hợp đồng mới"
        description="Tạo hợp đồng chính thức trên hệ thống VCPMC."
        actions={<StepIndicator steps={steps} />}
      />

      {/* Template Search Section (Phase TEMPLATE-CREATE-01) */}
      <ContractTemplateSearch
        selectedTemplateId={selectedTemplateId}
        selectedTemplateNo={selectedTemplateNo}
        selectedTemplateName={selectedTemplateName}
        formEditedAfterPrefill={formEditedAfterPrefill}
        onTemplateSelected={handleTemplateSelected}
        onTemplateCleared={handleTemplateCleared}
        onPrefillData={handlePrefillData}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* =================================================================== */}
          {/* SECTION 1: THÔNG TIN CHUNG */}
          {/* Shared across all Background domains */}
          {/* =================================================================== */}
          <FormSection
            title="1. Định danh hợp đồng"
            description="Số hợp đồng, ngày lập, năm và mã định danh"
          >
            <div>
              <div>
                <div className="space-y-4">
                  <ContractNumberPreview contractNo={contractNoPreview} />
                  {/* Availability check */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={checkAvailability}
                      disabled={isCheckingAvailability || !contractNoPreview}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCheckingAvailability ? 'Đang kiểm tra...' : 'Kiểm tra số hợp đồng'}
                    </button>
                    {availabilityCheck && (
                      <div className={`mt-2 px-3 py-2 rounded-md text-xs ${
                        availabilityCheck.available
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {availabilityCheck.available ? (
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span>
                            <span>{availabilityCheck.message}</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">!</span>
                              <span className="font-semibold">{availabilityCheck.message}</span>
                            </div>
                            <p className="ml-6 font-mono">{availabilityCheck.contract_no}</p>
                            {availabilityCheck.suggested_next && (
                              <div className="ml-6 mt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Extract short_no from suggested_next
                                    const parts = availabilityCheck.suggested_next?.split('/');
                                    if (parts && parts.length >= 1) {
                                      updateDraft((current) => ({
                                        ...current,
                                        common: {
                                          ...current.common,
                                          contractNumber: parts[0],
                                        },
                                      }));
                                      setAvailabilityCheck(null);
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  Dùng số gợi ý: {availabilityCheck.suggested_next}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <FieldGrid cols={3}>
                    <Input
                      label="Số hợp đồng *"
                      value={draft.common.contractNumber}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          common: {
                            ...current.common,
                            contractNumber: e.target.value,
                          },
                        }))
                      }
                      required
                      hint="USER INPUT only - không tự động tạo"
                    />
                    <Input
                      label="Ngày lập"
                      type="date"
                      value={draft.common.signedDate}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          common: { ...current.common, signedDate: e.target.value },
                        }))
                      }
                      required
                    />
                    <Select
                      label="Năm"
                      value={draft.common.contractYear}
                      onChange={(value) =>
                        updateDraft((current) => ({
                          ...current,
                          common: { ...current.common, contractYear: value },
                        }))
                      }
                      options={CONTRACT_YEAR_OPTIONS}
                    />
                  </FieldGrid>
                  <FieldGrid cols={3}>
                    <Select
                      label="Mã vùng"
                      value={draft.common.regionCode}
                      onChange={(value) =>
                        updateDraft((current) => ({
                          ...current,
                          common: { ...current.common, regionCode: value },
                        }))
                      }
                      options={CREATE_CONTRACT_REGION_OPTIONS}
                    />
                    <Select
                      label="Khu vực"
                      value={draft.common.areaCode}
                      onChange={(value) =>
                        updateDraft((current) => ({
                          ...current,
                          common: { ...current.common, areaCode: value },
                        }))
                      }
                      options={CREATE_CONTRACT_AREA_OPTIONS}
                    />
                    <Select
                      label="Mã quyền"
                      value={draft.common.fieldCode}
                      onChange={(value) =>
                        updateDraft((current) => ({
                          ...current,
                          common: { ...current.common, fieldCode: value },
                        }))
                      }
                      options={[
                        { value: 'PR', label: 'PR (Quyền biểu diễn)' },
                        { value: 'MR', label: 'MR (Quyền cơ khí)' },
                      ]}
                    />
                  </FieldGrid>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="2. Đối tác & Địa chỉ"
            description="Pháp nhân, người đại diện và địa chỉ pháp lý / sử dụng âm nhạc"
          >
            <div className="space-y-6">
              <div>
                <div className="space-y-4">
                  <FieldGrid>
                    <Input
                      label="Tên đơn vị *"
                      value={draft.customer.legalName}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          customer: { ...current.customer, legalName: e.target.value },
                        }))
                      }
                      required
                    />
                    <Input
                      label="Tên bảng hiệu *"
                      value={draft.customer.brandName}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          customer: { ...current.customer, brandName: e.target.value },
                        }))
                      }
                      required
                    />
                  </FieldGrid>
                  <FieldGrid>
                    <Input
                      label="Người đại diện"
                      value={draft.customer.representativeName}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          customer: {
                            ...current.customer,
                            representativeName: e.target.value,
                          },
                        }))
                      }
                    />
                    <Input
                      label="Chức vụ"
                      value={draft.customer.representativeTitle}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          customer: {
                            ...current.customer,
                            representativeTitle: e.target.value,
                          },
                        }))
                      }
                    />
                  </FieldGrid>
                  <FieldGrid cols={3}>
                    <Input
                      label="Mã số thuế"
                      value={draft.customer.taxCode}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          customer: { ...current.customer, taxCode: e.target.value },
                        }))
                      }
                    />
                    <Input
                      label="Số CCCD"
                      value={draft.customer.cccd}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          customer: { ...current.customer, cccd: e.target.value },
                        }))
                      }
                    />
                    <Input
                      label="Điện thoại"
                      type="tel"
                      value={draft.customer.phone}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          customer: { ...current.customer, phone: e.target.value },
                        }))
                      }
                    />
                  </FieldGrid>
                  <FieldGrid>
                    <Input
                      label="Email"
                      type="email"
                      value={draft.customer.email}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          customer: { ...current.customer, email: e.target.value },
                        }))
                      }
                    />
                  </FieldGrid>

                  {/* A. Địa chỉ pháp lý / trụ sở */}
                  <div className="border border-dashed border-zinc-300 rounded-lg p-4 bg-zinc-50">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        A. Địa chỉ pháp lý / trụ sở
                      </span>
                    </div>
                    <div className="space-y-3">
                      <Input
                        label="Số nhà, tên đường, khu phố/thôn..."
                        placeholder="VD: 123 Nguyễn Huệ, Khu phố 3"
                        value={draft.customer.legalAddressLine}
                        onChange={(e) =>
                          updateDraft((current) => {
                            const newLine = e.target.value;
                            const newFull = buildFullAddress(
                              newLine,
                              current.customer.legalWard,
                              current.customer.legalProvince
                            );
                            return {
                              ...current,
                              customer: {
                                ...current.customer,
                                legalAddressLine: newLine,
                                legalFullAddress: newFull,
                                legalAddress: newFull,
                              },
                            };
                          })
                        }
                      />
                      <FieldGrid cols={2}>
                        <Input
                          label="Phường/Xã sau sáp nhập"
                          placeholder="VD: Phường Bến Nghé"
                          value={draft.customer.legalWard}
                          onChange={(e) =>
                            updateDraft((current) => {
                              const newWard = e.target.value;
                              const newFull = buildFullAddress(
                                current.customer.legalAddressLine,
                                newWard,
                                current.customer.legalProvince
                              );
                              return {
                                ...current,
                                customer: {
                                  ...current.customer,
                                  legalWard: newWard,
                                  legalFullAddress: newFull,
                                  legalAddress: newFull,
                                },
                              };
                            })
                          }
                        />
                        <Input
                          label="Tỉnh/Thành phố"
                          placeholder="VD: TP. Hồ Chí Minh"
                          value={draft.customer.legalProvince}
                          onChange={(e) =>
                            updateDraft((current) => {
                              const newProvince = e.target.value;
                              const newFull = buildFullAddress(
                                current.customer.legalAddressLine,
                                current.customer.legalWard,
                                newProvince
                              );
                              return {
                                ...current,
                                customer: {
                                  ...current.customer,
                                  legalProvince: newProvince,
                                  legalFullAddress: newFull,
                                  legalAddress: newFull,
                                },
                              };
                            })
                          }
                        />
                      </FieldGrid>
                      <Input
                        label="Địa chỉ đầy đủ"
                        placeholder="Auto-built: [Số nhà/đường], [Phường/Xã], [Tỉnh/Thành phố]"
                        value={draft.customer.legalFullAddress}
                        onChange={(e) =>
                          updateDraft((current) => ({
                            ...current,
                            customer: {
                              ...current.customer,
                              legalFullAddress: e.target.value,
                              legalAddress: e.target.value,
                            },
                          }))
                        }
                        className="font-medium text-zinc-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* B. Địa chỉ sử dụng âm nhạc */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
                    B. Địa chỉ sử dụng âm nhạc
                  </h4>
                  <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={draft.location.usageSameAsLegal}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          updateDraft((current) => ({
                            ...current,
                            location: syncUsageFromLegal(current.customer, current.location),
                          }));
                        } else {
                          updateDraft((current) => ({
                            ...current,
                            location: {
                              ...current.location,
                              usageSameAsLegal: false,
                            },
                          }));
                        }
                      }}
                      className="w-3.5 h-3.5 rounded border-zinc-400"
                    />
                    <span className="font-medium text-blue-700">
                      Giống địa chỉ pháp lý
                    </span>
                  </label>
                </div>

                <div className={`space-y-3 ${draft.location.usageSameAsLegal ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                  <Input
                    label="Số nhà, tên đường, khu phố/thôn..."
                    placeholder="VD: 456 Lê Lợi, Khu phố 5"
                    value={draft.location.usageAddressLine}
                    onChange={(e) =>
                      updateDraft((current) => {
                        const newLine = e.target.value;
                        const newFull = buildFullAddress(
                          newLine,
                          current.location.usageWard,
                          current.location.usageProvince
                        );
                        return {
                          ...current,
                          location: {
                            ...current.location,
                            usageAddressLine: newLine,
                            usageFullAddress: newFull,
                            usageAddress: newFull,
                          },
                        };
                      })
                    }
                  />
                  <FieldGrid cols={2}>
                    <Input
                      label="Phường/Xã sau sáp nhập"
                      placeholder="VD: Phường Bến Nghé"
                      value={draft.location.usageWard}
                      onChange={(e) =>
                        updateDraft((current) => {
                          const newWard = e.target.value;
                          const newFull = buildFullAddress(
                            current.location.usageAddressLine,
                            newWard,
                            current.location.usageProvince
                          );
                          return {
                            ...current,
                            location: {
                              ...current.location,
                              usageWard: newWard,
                              usageFullAddress: newFull,
                              usageAddress: newFull,
                            },
                          };
                        })
                      }
                    />
                    <Input
                      label="Tỉnh/Thành phố"
                      placeholder="VD: TP. Hồ Chí Minh"
                      value={draft.location.usageProvince}
                      onChange={(e) =>
                        updateDraft((current) => {
                          const newProvince = e.target.value;
                          const newFull = buildFullAddress(
                            current.location.usageAddressLine,
                            current.location.usageWard,
                            newProvince
                          );
                          return {
                            ...current,
                            location: {
                              ...current.location,
                              usageProvince: newProvince,
                              usageFullAddress: newFull,
                              usageAddress: newFull,
                            },
                          };
                        })
                      }
                    />
                  </FieldGrid>
                  <Input
                    label="Địa chỉ đầy đủ"
                    placeholder="Auto-built: [Số nhà/đường], [Phường/Xã], [Tỉnh/Thành phố]"
                    value={draft.location.usageFullAddress}
                    onChange={(e) =>
                      updateDraft((current) => ({
                        ...current,
                        location: {
                          ...current.location,
                          usageFullAddress: e.target.value,
                          usageAddress: e.target.value,
                        },
                      }))
                    }
                    className="font-medium text-zinc-800"
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="3. Thời hạn & người thực hiện"
            description="Hiệu lực hợp đồng và người chịu trách nhiệm"
          >
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-3">
                  Thời hạn hợp đồng
                </h4>
                <div className="space-y-4">
                  <FieldGrid cols={2}>
                    <Input
                      label="Ngày bắt đầu"
                      type="date"
                      value={draft.term.effectiveFrom}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          term: { ...current.term, effectiveFrom: e.target.value },
                        }))
                      }
                      required
                    />
                    <Input
                      label="Ngày kết thúc"
                      type="date"
                      value={draft.term.effectiveTo}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          term: { ...current.term, effectiveTo: e.target.value },
                        }))
                      }
                      required
                    />
                  </FieldGrid>
                  <Select
                    label="Loại hợp đồng"
                    value={draft.domain.renewalStatus}
                    onChange={(value) =>
                      updateDraft((current) => ({
                        ...current,
                        domain: {
                          ...current.domain,
                          renewalStatus: value as CreateContractRenewalStatus,
                          // Reset reference contract when switching away from tái ký
                          ...(value !== 'PENDING_RENEWAL'
                            ? { referenceContractId: null, referenceContractNo: '' }
                            : {}),
                        },
                      }))
                    }
                    options={CREATE_CONTRACT_RENEWAL_OPTIONS}
                  />

                  {/* Tái ký: reference contract search */}
                  {draft.domain.renewalStatus === 'PENDING_RENEWAL' && (
                    <div className="mt-3 p-3 border border-blue-200 bg-blue-50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                        <span>Hợp đồng gốc tham chiếu</span>
                      </div>
                      <Input
                        label="Tìm hợp đồng gốc"
                        placeholder="Nhập số HĐ hoặc tên đơn vị..."
                        value={draft.domain.referenceContractNo || ''}
                        onChange={(e) =>
                          updateDraft((current) => ({
                            ...current,
                            domain: {
                              ...current.domain,
                              referenceContractNo: e.target.value,
                            },
                          }))
                        }
                      />
                      {draft.domain.referenceContractId && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 border border-blue-300 rounded text-xs text-blue-800 font-medium">
                          <span>Đã chọn HĐ gốc: </span>
                          <span className="font-semibold">{draft.domain.referenceContractNo}</span>
                        </div>
                      )}
                      <p className="text-xs text-blue-600">
                        Dùng để prefill thông tin. Không cập nhật hợp đồng cũ.
                      </p>
                    </div>
                  )}

                  {/* Hợp đồng khung: info note */}
                  {draft.domain.renewalStatus === 'FRAME_CONTRACT' && (
                    <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                      Áp dụng cho nhiều địa điểm / nhiều phụ lục. Thời hạn linh hoạt hơn.
                    </div>
                  )}
                </div>
              </div>

              {/* Người thực hiện */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-3">
                  Người thực hiện
                </h4>
                <FieldGrid>
                  <Select
                    label="Người thực hiện"
                    value={draft.assignee.name}
                    onChange={(value) =>
                      updateDraft((current) => ({
                        ...current,
                        assignee: {
                          name: value,
                          email: CREATE_CONTRACT_ASSIGNEE_EMAILS[value] || '',
                        },
                      }))
                    }
                    options={CREATE_CONTRACT_ASSIGNEE_OPTIONS}
                  />
                  <Input
                    label="Email người thực hiện"
                    type="email"
                    value={draft.assignee.email}
                    onChange={(e) =>
                      updateDraft((current) => ({
                        ...current,
                        assignee: { ...current.assignee, email: e.target.value },
                      }))
                    }
                    disabled
                    hint="Tự động điền theo người thực hiện"
                  />
                </FieldGrid>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="4. Ghi chú & điều khoản"
            description="Ghi chú nội bộ và điều khoản xuất hợp đồng"
          >
            <div className="space-y-4">
              <Textarea
                label="Ghi chú nội bộ"
                value={draft.notes.internal}
                onChange={(e) =>
                  updateDraft((current) => ({
                    ...current,
                    notes: { ...current.notes, internal: e.target.value },
                  }))
                }
                placeholder="Ghi chú cho nội bộ VCPMC..."
              />
              <Textarea
                label="Điều khoản / Ghi chú xuất hợp đồng"
                value={draft.notes.contractTerms}
                onChange={(e) =>
                  updateDraft((current) => ({
                    ...current,
                    notes: {
                      ...current.notes,
                      contractTerms: e.target.value,
                    },
                  }))
                }
                placeholder="Điều khoản sẽ xuất hiện trên hợp đồng..."
              />
            </div>
          </FormSection>

          {/* =================================================================== */}
          {/* SECTION 2: LĨNH VỰC */}
          {/* Domain selector - all Background domains */}
          {/* =================================================================== */}
          <FormSection
            title="5. Lĩnh vực"
            description="Chọn lĩnh vực kinh doanh Background"
          >
            <div className="space-y-4">
              <Select
                label="Lĩnh vực *"
                value={draft.domain.domainCode}
                onChange={(value) => updateDomain(value as BackgroundDomainCode)}
                options={CREATE_CONTRACT_BACKGROUND_DOMAIN_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />

              {/* Domain description */}
              <div className="p-3 rounded-lg bg-indigo-50/50 ring-1 ring-indigo-600/10">
                <p className="text-xs text-indigo-700">
                  <span className="font-semibold">
                    {draft.domain.domainDisplayName}
                  </span>
                  {draft.domain.domainGroup === 'background' && ' · Background'}
                </p>
              </div>
            </div>
          </FormSection>

          {/* =================================================================== */}
          {/* SECTION 2B: MẪU XUẤT HỢP ĐỒNG */}
          {/* Phase BACKGROUND-TEMPLATE-REFACTOR: Template selection */}
          {/* =================================================================== */}
          <FormSection
            title="6. Mẫu xuất hợp đồng"
            description="Chọn mẫu Word để xuất hợp đồng"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mẫu 1 */}
              <button
                type="button"
                onClick={() => updateDraft((current) => ({
                  ...current,
                  contractTemplateCode: 'TEMPLATE_1',
                }))}
                className={`
                  relative p-4 rounded-xl border-2 text-left transition-all
                  ${draft.contractTemplateCode === 'TEMPLATE_1'
                    ? 'border-violet-600 bg-violet-50 shadow-sm'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${draft.contractTemplateCode === 'TEMPLATE_1'
                      ? 'border-violet-600 bg-violet-600'
                      : 'border-zinc-300'
                    }
                  `}>
                    {draft.contractTemplateCode === 'TEMPLATE_1' && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${
                      draft.contractTemplateCode === 'TEMPLATE_1'
                        ? 'text-violet-900'
                        : 'text-zinc-900'
                    }`}>
                      Mẫu 1
                    </p>
                    <p className={`text-xs mt-0.5 ${
                      draft.contractTemplateCode === 'TEMPLATE_1'
                        ? 'text-violet-700'
                        : 'text-zinc-500'
                    }`}>
                      export_template_contract_1.docx
                    </p>
                  </div>
                </div>
                {draft.contractTemplateCode === 'TEMPLATE_1' && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-600 text-white">
                      Đang chọn
                    </span>
                  </div>
                )}
              </button>

              {/* Mẫu 2 */}
              <button
                type="button"
                onClick={() => updateDraft((current) => ({
                  ...current,
                  contractTemplateCode: 'TEMPLATE_2',
                }))}
                className={`
                  relative p-4 rounded-xl border-2 text-left transition-all
                  ${draft.contractTemplateCode === 'TEMPLATE_2'
                    ? 'border-violet-600 bg-violet-50 shadow-sm'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${draft.contractTemplateCode === 'TEMPLATE_2'
                      ? 'border-violet-600 bg-violet-600'
                      : 'border-zinc-300'
                    }
                  `}>
                    {draft.contractTemplateCode === 'TEMPLATE_2' && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${
                      draft.contractTemplateCode === 'TEMPLATE_2'
                        ? 'text-violet-900'
                        : 'text-zinc-900'
                    }`}>
                      Mẫu 2
                    </p>
                    <p className={`text-xs mt-0.5 ${
                      draft.contractTemplateCode === 'TEMPLATE_2'
                        ? 'text-violet-700'
                        : 'text-zinc-500'
                    }`}>
                      export_template_contract_2.docx
                    </p>
                  </div>
                </div>
                {draft.contractTemplateCode === 'TEMPLATE_2' && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-600 text-white">
                      Đang chọn
                    </span>
                  </div>
                )}
              </button>
            </div>

            {/* Helper text */}
            <p className="mt-2 text-xs text-zinc-500">
              Cả hai mẫu đều có cùng placeholder và nội dung. Khác nhau về bố cục/format.
            </p>
          </FormSection>

          {/* =================================================================== */}
          {/* SECTION 3: KHU VỰC KINH DOANH */}
          {/* Domain-specific fields */}
          {/* =================================================================== */}
          <FormSection
            title="3. Khu vực kinh doanh"
            description="Thông tin tùy theo lĩnh vực đã chọn"
          >
            {isKaraokeDomain ? (
              // Karaoke domain - MusicUsageAreaSection + SimpleRoyaltyInput
              <div className="space-y-6">
                {/* Music usage areas table */}
                <MusicUsageAreaSection
                  value={draft.areaBased.musicUsageAreas}
                  onChange={(areas) =>
                    updateDraft((current) => ({
                      ...current,
                      areaBased: {
                        ...current.areaBased,
                        musicUsageAreas: areas,
                      },
                    }))
                  }
                  scaleLabel="Số phòng / số chỗ"
                />

                {/* Simplified royalty input */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-3">
                    Tiền bản quyền
                  </h4>
                  <SimpleRoyaltyInput
                    initialData={{
                      royaltyAmountBeforeVat: draft.areaBased.royaltyAmountBeforeVat || 0,
                      vatRate: draft.areaBased.vatRate || 8,
                      vatAmount: draft.areaBased.vatAmount || 0,
                      totalAmountAfterVat: draft.areaBased.royaltyAmountAfterVat || 0,
                      amountInWords: draft.areaBased.royaltyAmountInWords || '',
                    }}
                    onChange={(data) => {
                      updateDraft((current) => ({
                        ...current,
                        areaBased: {
                          ...current.areaBased,
                          royaltyAmountBeforeVat: data.royaltyAmountBeforeVat,
                          vatRate: data.vatRate,
                          vatAmount: data.vatAmount,
                          royaltyAmountAfterVat: data.totalAmountAfterVat,
                          royaltyAmountInWords: data.amountInWords,
                        },
                      }));
                    }}
                  />
                </div>
              </div>
            ) : isAreaBasedDomainFlag ? (
              // Area-based domain - MusicUsageAreaSection + SimpleRoyaltyInput for all Background domains
              <div className="space-y-6">
                <MusicUsageAreaSection
                  value={draft.areaBased.musicUsageAreas}
                  onChange={(areas) =>
                    updateDraft((current) => ({
                      ...current,
                      areaBased: {
                        ...current.areaBased,
                        musicUsageAreas: areas,
                      },
                    }))
                  }
                  domainCode={draft.domain.domainCode}
                  scaleLabel={isKaraokeDomain ? 'Số phòng / số chỗ' : 'Quy mô, sức chứa'}
                />

                {/* Phase 2: Simplified royalty input */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-3">
                    Thông tin tiền tham khảo
                  </h4>
                  <SimpleRoyaltyInput
                    initialData={{
                      royaltyAmountBeforeVat: draft.areaBased.royaltyAmountBeforeVat || 0,
                      vatRate: draft.areaBased.vatRate || 8,
                      vatAmount: draft.areaBased.vatAmount || 0,
                      totalAmountAfterVat: draft.areaBased.royaltyAmountAfterVat || 0,
                      amountInWords: draft.areaBased.royaltyAmountInWords || '',
                    }}
                    onChange={(data) => {
                      updateDraft((current) => ({
                        ...current,
                        areaBased: {
                          ...current.areaBased,
                          royaltyAmountBeforeVat: data.royaltyAmountBeforeVat,
                          vatRate: data.vatRate,
                          vatAmount: data.vatAmount,
                          royaltyAmountAfterVat: data.totalAmountAfterVat,
                          royaltyAmountInWords: data.amountInWords,
                        },
                      }));
                    }}
                  />
                </div>
              </div>
            ) : isPlaceholderOnlyDomainFlag ? (
              // Placeholder for domain-specific forms not yet implemented
              <div className="p-4 rounded-lg bg-zinc-100 text-center">
                <p className="text-sm text-zinc-600">
                  {DOMAIN_PLACEHOLDER_ONLY_PLACEHOLDER}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Lĩnh vực "{draft.domain.domainDisplayName}" sẽ có form riêng ở phase sau.
                </p>
              </div>
            ) : (
              // Generic placeholder for other non-implemented domains
              <div className="p-4 rounded-lg bg-zinc-100 text-center">
                <p className="text-sm text-zinc-600">
                  {DOMAIN_NOT_IMPLEMENTED_PLACEHOLDER}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Lĩnh vực "{draft.domain.domainDisplayName}" sẽ có form khu vực/tính phí riêng ở phase sau.
                </p>
              </div>
            )}
          </FormSection>


          {/* =================================================================== */}
          {/* VALIDATION ERRORS */}
          {/* =================================================================== */}
          {blockingErrors.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-2">Vui lòng sửa các lỗi sau:</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {blockingErrors.map((error, i) => (
                  <li key={i}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* =================================================================== */}
          {/* FOOTER ACTIONS */}
          {/* =================================================================== */}
          <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-zinc-50/95 backdrop-blur-sm border-t border-zinc-200 flex items-center gap-3">
            <Button
              variant="ghost"
              leftIcon={<XIcon className="h-4 w-4" />}
              onClick={handleCancel}
            >
              Hủy
            </Button>
            <div className="flex-1" />
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateContract}
              disabled={!canCreateContract || isCreateLoading}
              title="Tạo hợp đồng chính thức"
            >
              {isCreateLoading ? 'Đang tạo...' : 'Tạo hợp đồng'}
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft}>
              Lưu nháp cục bộ
            </Button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SIDEBAR: SUMMARY */}
        {/* =================================================================== */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Contract summary */}
            <div className="rounded-xl bg-white p-4 ring-1 ring-zinc-200">
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                Tóm tắt hợp đồng
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Số HĐ</span>
                  <span className="font-mono font-semibold">
                    {contractNoPreview || '(chưa có)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Loại HĐ</span>
                  <span className="font-medium text-blue-700">
                    {draft.domain.renewalStatus === 'NEW' ? 'Ký mới' :
                     draft.domain.renewalStatus === 'PENDING_RENEWAL' ? 'Tái ký' :
                     draft.domain.renewalStatus === 'FRAME_CONTRACT' ? 'Hợp đồng khung' : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Đối tác</span>
                  <span className="truncate max-w-[150px]">
                    {draft.customer.legalName || '(chưa có)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Bảng hiệu</span>
                  <span className="truncate max-w-[150px]">
                    {draft.customer.brandName || '(chưa có)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Lĩnh vực</span>
                  <span>{draft.domain.domainDisplayName || '(chưa chọn)'}</span>
                </div>
                {/* Phase BACKGROUND-TEMPLATE-REFACTOR: Show selected export template */}
                <div className="flex justify-between">
                  <span className="text-zinc-600">Mẫu xuất</span>
                  <span className="font-medium text-violet-700">
                    {draft.contractTemplateCode === 'TEMPLATE_2' ? 'Mẫu 2' : 'Mẫu 1'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Template</span>
                  <span className="font-mono text-zinc-500 text-[10px]">
                    {draft.contractTemplateCode === 'TEMPLATE_2'
                      ? 'export_template_contract_2.docx'
                      : 'export_template_contract_1.docx'}
                  </span>
                </div>
                {/* Nguồn mẫu (Phase TEMPLATE-CREATE-01) */}
                {draft.domain.sourceTemplateContractNo && (
                  <div className="flex justify-between items-center bg-blue-50 px-2 py-1 rounded">
                    <span className="text-blue-600 text-[10px]">Mẫu từ HĐ:</span>
                    <span className="font-mono text-blue-700 text-[10px] font-medium">
                      {draft.domain.sourceTemplateContractNo}
                    </span>
                  </div>
                )}
                {/* Tái ký reference (existing feature) */}
                {draft.domain.referenceContractNo && (
                  <div className="flex justify-between items-center bg-amber-50 px-2 py-1 rounded">
                    <span className="text-amber-600 text-[10px]">Tái ký từ HĐ:</span>
                    <span className="font-mono text-amber-700 text-[10px] font-medium">
                      {draft.domain.referenceContractNo}
                    </span>
                  </div>
                )}
                {isKaraokeDomain && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Phòng/Box</span>
                    <span>
                      {draft.karaoke.karaokeType === 'PHONG'
                        ? `${draft.karaoke.totalRooms} phòng`
                        : `${draft.karaoke.totalBoxes} box`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-600">Thời hạn</span>
                  <span>
                    {draft.term.effectiveFrom
                      ? `${draft.term.effectiveFrom} → ${draft.term.effectiveTo}`
                      : '(chưa có)'}
                  </span>
                </div>
                {(draft.areaBased.royaltyAmountAfterVat ?? 0) > 0 && (
                  <div className="pt-2 border-t border-zinc-200 flex justify-between">
                    <span className="font-semibold text-zinc-900">
                      Tổng tiền
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {(draft.areaBased.royaltyAmountAfterVat ?? 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Checklist */}
            <div className="rounded-xl bg-white p-4 ring-1 ring-zinc-200">
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                Checklist
              </h3>
              <div className="space-y-2">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        item.completed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-zinc-200 text-zinc-500'
                      }`}
                    >
                      {item.completed ? '✓' : '·'}
                    </span>
                    <span
                      className={`text-xs ${
                        item.completed ? 'text-emerald-700' : 'text-zinc-500'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info note */}
            <div className="rounded-lg bg-sky-50 p-3 text-xs text-sky-800 ring-1 ring-sky-600/15">
              <p className="font-semibold">Lưu ý:</p>
              <ul className="mt-1 space-y-1">
                <li>• Số HĐ là USER INPUT</li>
                <li>• Kiểm tra kỹ trước khi tạo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}


