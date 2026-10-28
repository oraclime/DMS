import React, { useState, useMemo } from 'react';
import { 
  Search, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Folder, 
  Eye, 
  Plus, 
  Filter, 
  Layers, 
  FileCheck, 
  Download, 
  UserCheck, 
  ChevronRight, 
  HardDrive, 
  UserPlus,
  CreditCard,
  Building2,
  Warehouse,
  Store,
  Wrench,
  Tag,
  Paperclip,
  Users,
  Trash2
} from 'lucide-react';
import { 
  TechnicianRecord, 
  VerificationStatus, 
  UserAccount, 
  MainCategory,
  PartnerType,
  AttachedDocument
} from '../types/dms';
import { StorageService } from '../services/storageService';
import { OraclimeLogo } from './OraclimeLogo';

interface SearchDashboardProps {
  technicians: TechnicianRecord[];
  onSelectTechnician: (tech: TechnicianRecord) => void;
  onOpenImport: () => void;
  onOpenNewTechnician: () => void;
  onOpenNewPartner: () => void;
  onOpenCustomUpload: () => void;
  onOpenTechForm: () => void;
  onOpenPartnerForm: () => void;
  onOpenReview: () => void;
  onOpenBackup: () => void;
  onDeleteTechnician?: (tech: TechnicianRecord, permanent: boolean, reason?: string) => void;
  quickSearchQuery: string;
  setQuickSearchQuery: (q: string) => void;
  currentUser: UserAccount;
}

export const SearchDashboard: React.FC<SearchDashboardProps> = ({
  technicians,
  onSelectTechnician,
  onOpenImport,
  onOpenNewTechnician,
  onOpenNewPartner,
  onOpenCustomUpload,
  onOpenTechForm,
  onOpenPartnerForm,
  onOpenReview,
  onOpenBackup,
  onDeleteTechnician,
  quickSearchQuery,
  setQuickSearchQuery,
  currentUser,
}) => {
  // Main Category filter: All | Technician | Partner
  const [mainCategoryFilter, setMainCategoryFilter] = useState<'all' | MainCategory>('all');
  
  // Secondary Partner Type filter: used when Partners is active or viewed
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<'all' | PartnerType>('all');
  
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Compute aggregate statistics
  const totalRecords = technicians.length;
  const totalTechnicians = technicians.filter(t => t.mainCategory === 'Technician' || (!t.mainCategory && (!t.entityType || t.entityType === 'technician'))).length;
  const totalPartners = technicians.filter(t => t.mainCategory === 'Partner' || ['service_center', 'godown', 'wholesaler'].includes(t.entityType || '')).length;
  const totalDocuments = technicians.reduce((acc, t) => acc + (t.documents?.length || 0), 0) + StorageService.getStandaloneDocuments().length;
  const allUsersCount = StorageService.getUsers().length;
  const pendingReview = technicians.filter(t => t.status === 'pending_review').length;
  const flaggedCount = technicians.filter(t => t.status === 'flagged_handwritten').length;

  // Available districts dynamically calculated
  const districts = useMemo(() => {
    const set = new Set(technicians.map(t => t.district).filter(Boolean));
    return Array.from(set);
  }, [technicians]);

  // Filtered technicians & partners
  const filteredRecords = useMemo(() => {
    const q = quickSearchQuery.trim().toUpperCase();
    return technicians.filter(t => {
      // Free text search matching multiple attributes
      const matchDocName = t.documents?.some(d => 
        d.filename.toUpperCase().includes(q) || 
        (d.customTitle && d.customTitle.toUpperCase().includes(q)) ||
        d.docType.toUpperCase().includes(q)
      );

      const matchQuery = 
        !q ||
        t.applicationNumber.toUpperCase().includes(q) ||
        (t.technicianId && t.technicianId.toUpperCase().includes(q)) ||
        t.fullName.toUpperCase().includes(q) ||
        (t.contactPerson && t.contactPerson.toUpperCase().includes(q)) ||
        t.mobile.includes(q) ||
        (t.alternateMobile && t.alternateMobile.includes(q)) ||
        t.district.toUpperCase().includes(q) ||
        (t.address && t.address.toUpperCase().includes(q)) ||
        (t.partnerType && t.partnerType.toUpperCase().includes(q)) ||
        (t.specialization && t.specialization.toUpperCase().includes(q)) ||
        (t.bankDetails?.accountNumber && t.bankDetails.accountNumber.includes(q)) ||
        (t.bankDetails?.bankName && t.bankDetails.bankName.toUpperCase().includes(q)) ||
        (t.gstNumber && t.gstNumber.toUpperCase().includes(q)) ||
        (t.panNumber && t.panNumber.toUpperCase().includes(q)) ||
        Boolean(matchDocName);

      // Main Category Match
      const effectiveMainCategory: MainCategory = t.mainCategory || (['service_center', 'godown', 'wholesaler'].includes(t.entityType || '') ? 'Partner' : 'Technician');
      const matchMainCategory = mainCategoryFilter === 'all' || effectiveMainCategory === mainCategoryFilter;

      // Secondary Partner Type Match (applicable if filtering within partners)
      let matchPartnerType = true;
      if (partnerTypeFilter !== 'all') {
        if (effectiveMainCategory !== 'Partner') {
          matchPartnerType = false;
        } else {
          matchPartnerType = t.partnerType === partnerTypeFilter;
        }
      }

      const matchDistrict = districtFilter === 'all' || t.district === districtFilter;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;

      return matchQuery && matchMainCategory && matchPartnerType && matchDistrict && matchStatus;
    });
  }, [technicians, quickSearchQuery, mainCategoryFilter, partnerTypeFilter, districtFilter, statusFilter]);

  const renderEntityBadge = (record: TechnicianRecord) => {
    if (record.mainCategory === 'Partner' || ['service_center', 'godown', 'wholesaler'].includes(record.entityType || '')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-950/80 border border-indigo-700/70 text-indigo-300">
          <Building2 className="w-3 h-3 text-indigo-400" />
          <span>PARTNER · {record.partnerType || 'Business'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-cyan-950/80 border border-cyan-800/80 text-cyan-300">
        <Wrench className="w-3 h-3 text-cyan-400" />
        <span>TECHNICIAN</span>
      </span>
    );
  };

  const renderStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 border border-emerald-800/70 text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Verified</span>
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/60 border border-amber-800/70 text-amber-300">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Pending Review</span>
          </span>
        );
      case 'flagged_handwritten':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/60 border border-rose-800/70 text-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Handwritten Flag</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 text-slate-100 font-sans">
      {/* Top Hero Section */}
      <section className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-[1600px] mx-auto space-y-3">
          {/* Top Line: System Status Badge & Station Operator */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1 border-b border-slate-800/60">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 font-mono text-[11px] font-semibold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span className="truncate">WINDOWS 64-BIT LOCAL STATION · OFFLINE DOSSIER ARCHIVE</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="text-slate-500">STATION OPERATOR:</span>
              <span className="text-cyan-300 font-bold">{currentUser.fullName}</span>
              <span className="text-slate-600">·</span>
              <span className="uppercase text-slate-300 px-1.5 py-0.5 bg-slate-800 rounded font-semibold text-[10px]">{currentUser.role}</span>
            </div>
          </div>

          {/* Heading and Description with Official OraClime Logo */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <OraclimeLogo variant="mark" size="lg" />
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white uppercase font-sans">
                  ORACLIME TECHNICIAN & PARTNER FILE MANAGER
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 max-w-3xl leading-relaxed">
                  Centralized digital dossier archive for Technicians and Business Partners. Store banking details, KYC verifications, and original uploaded files.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons Bar */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            {/* Quick Add */}
            <button
              onClick={onOpenNewTechnician}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
              title="Enroll a new Technician record"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>+ Add Technician</span>
            </button>

            <button
              onClick={onOpenNewPartner}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
              title="Enroll a Service Center, Godown, or Wholesaler partner"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>+ Add Partner</span>
            </button>

            <span className="hidden sm:inline text-slate-700">|</span>

            {/* Document Intake */}
            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/80 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="General document & PDF upload with OCR intake"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload Document / PDF</span>
            </button>

            <button
              onClick={onOpenCustomUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Upload any file with a custom user-defined title and category"
            >
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload Custom Document</span>
            </button>

            <span className="hidden sm:inline text-slate-700">|</span>

            {/* Official Forms */}
            <button
              onClick={onOpenTechForm}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="View, download, or print official Technician Registration Form (AC-01)"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Technician Form</span>
            </button>

            <button
              onClick={onOpenPartnerForm}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="View, download, or print official Partner Registration Form & SLA (BP-02)"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Partner Form</span>
            </button>

            <span className="hidden sm:inline text-slate-700">|</span>

            {/* Operations */}
            <button
              onClick={onOpenReview}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-800/60 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Review pending handwritten or OCR verification tasks"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Review ({pendingReview + flaggedCount})</span>
            </button>

            {currentUser.role === 'super_admin' || currentUser.role === 'administrator' ? (
              <button
                onClick={onOpenBackup}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="System Backup & Recovery"
              >
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                <span>Backup</span>
              </button>
            ) : null}
          </div>

          {/* Key Statistics Strip: Technicians, Partners, Stored Documents, Application Users */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            {/* 1. Total Technicians */}
            <div 
              onClick={() => {
                setMainCategoryFilter('Technician');
                setPartnerTypeFilter('all');
              }}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between cursor-pointer transition-colors shadow-sm"
            >
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                  Total Technicians
                </span>
                <span className="text-2xl font-bold text-cyan-400 tabular-nums">
                  {totalTechnicians}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Enrolled field mechanics</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
            </div>

            {/* 2. Total Partners */}
            <div 
              onClick={() => {
                setMainCategoryFilter('Partner');
                setPartnerTypeFilter('all');
              }}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 flex items-center justify-between cursor-pointer transition-colors shadow-sm"
            >
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                  Total Partners
                </span>
                <span className="text-2xl font-bold text-indigo-400 tabular-nums">
                  {totalPartners}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Centers, Godowns & Dealers</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/50 text-indigo-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            {/* 3. Total Stored Documents */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                  Stored Documents
                </span>
                <span className="text-2xl font-bold text-emerald-400 tabular-nums">
                  {totalDocuments}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Original PDFs & Scans</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            {/* 4. Total Application Users (visible to administrators) */}
            {currentUser.role === 'super_admin' || currentUser.role === 'administrator' ? (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                    Application Users
                  </span>
                  <span className="text-2xl font-bold text-white tabular-nums">
                    {allUsersCount}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Provisioned System Accounts</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                    Active Station
                  </span>
                  <span className="text-xs font-bold text-cyan-300 truncate max-w-[140px] block mt-1">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 uppercase">{currentUser.role}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Search & Query Center */}
      <section className="px-4 sm:px-6 py-5 max-w-[1600px] w-full mx-auto space-y-5">
        {/* Main Category Tabs: All Directory Records | Technicians | Partners */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {/* Tab: All Records */}
            <button
              onClick={() => {
                setMainCategoryFilter('all');
                setPartnerTypeFilter('all');
              }}
              className={`px-4 py-2 rounded-lg font-bold transition-colors shrink-0 ${
                mainCategoryFilter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/40 border border-transparent'
              }`}
            >
              All Directory Records ({totalRecords})
            </button>

            {/* Tab: Technician */}
            <button
              onClick={() => {
                setMainCategoryFilter('Technician');
                setPartnerTypeFilter('all');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors shrink-0 ${
                mainCategoryFilter === 'Technician'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/40 border border-transparent'
              }`}
            >
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>Technicians ({totalTechnicians})</span>
            </button>

            {/* Tab: Partners */}
            <button
              onClick={() => setMainCategoryFilter('Partner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors shrink-0 ${
                mainCategoryFilter === 'Partner'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/40 border border-transparent'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Partners ({totalPartners})</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded transition-colors ${viewMode === 'cards' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Card View
            </button>
          </div>
        </div>

        {/* Secondary Partner Type Filter Pills (shown inside Partners section or when relevant) */}
        {(mainCategoryFilter === 'Partner' || mainCategoryFilter === 'all') && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider shrink-0 font-sans font-semibold">
              Partner Type Filter:
            </span>
            
            <button
              onClick={() => setPartnerTypeFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors shrink-0 ${
                partnerTypeFilter === 'all'
                  ? 'bg-indigo-900 text-white font-bold border border-indigo-700'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              All Partner Types
            </button>

            <button
              onClick={() => setPartnerTypeFilter('Service Center')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] transition-colors shrink-0 ${
                partnerTypeFilter === 'Service Center'
                  ? 'bg-amber-950 text-amber-300 font-bold border border-amber-700'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Building2 className="w-3 h-3 text-amber-400" />
              <span>Service Centers</span>
            </button>

            <button
              onClick={() => setPartnerTypeFilter('Godown / Warehouse')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] transition-colors shrink-0 ${
                partnerTypeFilter === 'Godown / Warehouse'
                  ? 'bg-purple-950 text-purple-300 font-bold border border-purple-700'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Warehouse className="w-3 h-3 text-purple-400" />
              <span>Godowns / Warehouses</span>
            </button>

            <button
              onClick={() => setPartnerTypeFilter('Wholesaler / Dealer')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] transition-colors shrink-0 ${
                partnerTypeFilter === 'Wholesaler / Dealer'
                  ? 'bg-blue-950 text-blue-300 font-bold border border-blue-700'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Store className="w-3 h-3 text-blue-400" />
              <span>Wholesalers / Dealers</span>
            </button>

            <button
              onClick={() => setPartnerTypeFilter('Other AC/HVAC Business')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] transition-colors shrink-0 ${
                partnerTypeFilter === 'Other AC/HVAC Business'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <span>Other AC/HVAC Businesses</span>
            </button>
          </div>
        )}

        {/* Search Bar & Secondary Attribute Filters */}
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Search Directory (Name, ID, Mobile, Bank Account, GST, Filename, Custom Title)</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Offline Indexed Lookup · Press Ctrl+K
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={quickSearchQuery}
              onChange={(e) => setQuickSearchQuery(e.target.value)}
              placeholder="Search by ID (e.g. TECH-1001), Name, Mobile, Bank Account, IFSC, GST, Filename, or Custom Document Title..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-16 py-3 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500 shadow-inner"
            />
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
            {quickSearchQuery && (
              <button
                onClick={() => setQuickSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-white font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {/* Secondary Filter Dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-3 flex-wrap">
              {/* District Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">District:</span>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Districts</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Verification Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="flagged_handwritten">Flagged (Handwritten)</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Displaying <strong className="text-cyan-400">{filteredRecords.length}</strong> of {totalRecords} records
            </div>
          </div>
        </div>

        {/* Records Display: Table or Card Mode */}
        {viewMode === 'table' ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold">Record ID</th>
                    <th className="py-3 px-4 font-bold">Name / Commercial Entity</th>
                    <th className="py-3 px-4 font-bold">Contact Mobile</th>
                    <th className="py-3 px-4 font-bold">District</th>
                    <th className="py-3 px-4 font-bold">Bank / Settlement</th>
                    <th className="py-3 px-4 font-bold">Documents</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
                        No records match your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((t) => (
                      <tr 
                        key={t.id} 
                        onClick={() => onSelectTechnician(t)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          {renderEntityBadge(t)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-cyan-400 group-hover:text-cyan-300">
                            {t.applicationNumber}
                          </div>
                          {t.technicianId && t.mainCategory === 'Technician' && (
                            <div className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/70 px-1.5 py-0.5 rounded inline-block mt-1">
                              {t.technicianId}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white group-hover:text-cyan-200">
                            {t.fullName}
                          </div>
                          {t.contactPerson && (
                            <div className="text-[11px] text-slate-400">
                              Contact: {t.contactPerson}
                            </div>
                          )}
                          {t.specialization && t.mainCategory === 'Technician' && (
                            <div className="text-[10px] text-cyan-400 font-mono">
                              {t.specialization}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {t.mobile}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {t.district}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {t.bankDetails?.accountNumber ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-emerald-500" />
                              <span>{t.bankDetails.bankName || 'Bank'} · ...{t.bankDetails.accountNumber.slice(-4)}</span>
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-cyan-400">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                            {t.documents?.length || 0} files
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {renderStatusBadge(t.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white rounded text-[11px] font-mono transition-colors">
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Cards Grid Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 font-mono bg-slate-900 rounded-xl border border-slate-800">
                No records match your search or filter criteria.
              </div>
            ) : (
              filteredRecords.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTechnician(t)}
                  className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 transition-all cursor-pointer shadow-md flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {renderEntityBadge(t)}
                      {renderStatusBadge(t.status)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {t.applicationNumber}
                        </span>
                        {t.technicianId && t.mainCategory === 'Technician' && (
                          <span className="text-[10px] font-mono font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-800/70 px-1.5 py-0.2 rounded">
                            {t.technicianId}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white group-hover:text-cyan-200 truncate">
                        {t.fullName}
                      </h4>
                      {t.contactPerson && (
                        <p className="text-xs text-slate-400 truncate">
                          Contact: {t.contactPerson}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Mobile</span>
                        <span className="text-slate-300">{t.mobile}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">District</span>
                        <span className="text-slate-300">{t.district}</span>
                      </div>
                    </div>

                    {t.bankDetails?.accountNumber && (
                      <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-emerald-300 flex items-center justify-between">
                        <span>{t.bankDetails.bankName || 'Bank Account'}</span>
                        <span className="font-bold">...{t.bankDetails.accountNumber.slice(-4)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t.documents?.length || 0} files</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        <span>Open Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};
