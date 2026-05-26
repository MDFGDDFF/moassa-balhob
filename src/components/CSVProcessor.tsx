import React, { useState, useRef } from 'react';
import { useLanguage } from './LanguageContext';
import { Download, Upload, AlertTriangle, CheckCircle2, RefreshCw, FileText } from 'lucide-react';
import { RegionId, ExcelLog } from '../types';

interface CSVProcessorProps {
  onImportSuccess: (data: { successCount: number; existUpdateCount: number; skippedCount: number; skippedRecords: string[] }) => void;
  onLogAdded: () => void;
  volunteers: any[];
  activities: any[];
  currentRegion: RegionId | 'all';
}

export function CSVProcessor({ onImportSuccess, onLogAdded, volunteers, activities, currentRegion }: CSVProcessorProps) {
  const { t, isRtl, token } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [detectedColumns, setDetectedColumns] = useState<Record<string, string>>({});
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV line helper
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const mapHeaderToIndex = (headerList: string[]) => {
    const mapping: Record<string, string> = {};
    headerList.forEach((h, idx) => {
      const cleaned = h.trim().toLowerCase();
      if (cleaned.includes('الاسم') || cleaned.includes('اسم') || cleaned.includes('name') || cleaned.includes('fullname')) {
        mapping['fullName'] = h;
      } else if (cleaned.includes('هوية') || cleaned.includes('هويه') || cleaned.includes('national') || cleaned.includes('nationalid') || cleaned === 'id' || cleaned.includes('رقم الهوية')) {
        mapping['nationalId'] = h;
      } else if (cleaned.includes('ميلاد') || cleaned.includes('سنة') || cleaned.includes('birth') || cleaned.includes('year') || cleaned.includes('العمر')) {
        mapping['birthYear'] = h;
      } else if (cleaned.includes('تواصل') || cleaned.includes('هاتف') || cleaned.includes('جوال') || cleaned.includes('phone') || cleaned.includes('mobile')) {
        mapping['phone'] = h;
      } else if (cleaned.includes('سكن') || cleaned.includes('عنوان') || cleaned.includes('address')) {
        mapping['address'] = h;
      } else if (cleaned.includes('جنس') || cleaned.includes('gender') || cleaned.includes('نوع')) {
        mapping['gender'] = h;
      } else if (cleaned.includes('حالة') || cleaned.includes('حاله') || cleaned.includes('status')) {
        mapping['status'] = h;
      } else if (cleaned.includes('منطقة') || cleaned.includes('المنطقة') || cleaned.includes('region')) {
        mapping['regionId'] = h;
      } else if (cleaned.includes('قصة') || cleaned.includes('story')) {
        mapping['story'] = h;
      }
    });
    return mapping;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError(isRtl ? 'عذراً، يرجى إدخال ملف بامتداد CSV فقط' : 'Please input a .csv file format only.');
      return;
    }

    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawCsvText(text);

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length > 0) {
        const parsedHeaders = parseCSVLine(lines[0]);
        const mapped = mapHeaderToIndex(parsedHeaders);
        setDetectedColumns(mapped);

        // Preview up to 5 rows
        const preview: string[][] = [];
        for (let i = 0; i < Math.min(6, lines.length); i++) {
          preview.push(parseCSVLine(lines[i]));
        }
        setPreviewRows(preview);
      }
    };
    reader.readAsText(file);
  };

  const triggerSubmitImport = async () => {
    if (!rawCsvText) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/volunteers/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          csvContent: rawCsvText,
          fileName: fileName
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to import CSV');
      }

      onImportSuccess(resData);
      onLogAdded();
      
      // Reset State
      setRawCsvText('');
      setPreviewRows([]);
      setFileName('');
      setDetectedColumns({});
    } catch (err: any) {
      setError(err.message || 'Error executing CSV Import');
    } finally {
      setLoading(false);
    }
  };

  // Export functions
  const convertToCSVAndDownload = (data: any[], headers: { key: string; label: string }[], filename: string) => {
    const csvRows: string[] = [];
    
    // Header row
    csvRows.push(headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(','));

    // Data rows
    data.forEach(item => {
      const row = headers.map(h => {
        const val = item[h.key] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });

    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM to support Excel Arabic characters correctly
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Track operation on server too
    fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fileName: `${filename}.csv`,
        type: 'export',
        regionId: currentRegion,
        recordsCount: data.length
      })
    }).then(() => onLogAdded()).catch(console.error);
  };

  const handleExportAllVolunteers = () => {
    const headers = [
      { key: 'fullName', label: isRtl ? 'الاسم رباعي' : 'Full Name' },
      { key: 'nationalId', label: isRtl ? 'رقم الهوية' : 'National ID' },
      { key: 'regionId', label: isRtl ? 'المنطقة' : 'Region' },
      { key: 'phone', label: isRtl ? 'رقم الهاتف' : 'Phone' },
      { key: 'address', label: isRtl ? 'عنوان السكن' : 'Address' },
      { key: 'birthYear', label: isRtl ? 'سنة الميلاد' : 'Birth Year' },
      { key: 'gender', label: isRtl ? 'الجنس' : 'Gender' },
      { key: 'joinDate', label: isRtl ? 'تاريخ الانضمام' : 'Join Date' },
      { key: 'status', label: isRtl ? 'الحالة' : 'Status' },
      { key: 'story', label: isRtl ? 'قصة المتطوع' : 'Volunteer Story' },
    ];
    convertToCSVAndDownload(volunteers, headers, 'all_volunteers');
  };

  const handleExportFilteredVolunteers = () => {
    const filtered = currentRegion === 'all' 
      ? volunteers 
      : volunteers.filter(v => v.regionId === currentRegion);
      
    const headers = [
      { key: 'fullName', label: isRtl ? 'الاسم رباعي' : 'Full Name' },
      { key: 'nationalId', label: isRtl ? 'رقم الهوية' : 'National ID' },
      { key: 'regionId', label: isRtl ? 'المنطقة' : 'Region' },
      { key: 'phone', label: isRtl ? 'رقم الهاتف' : 'Phone' },
      { key: 'address', label: isRtl ? 'عنوان السكن' : 'Address' },
      { key: 'birthYear', label: isRtl ? 'سنة الميلاد' : 'Birth Year' },
      { key: 'gender', label: isRtl ? 'الجنس' : 'Gender' },
      { key: 'joinDate', label: isRtl ? 'تاريخ الانضمام' : 'Join Date' },
      { key: 'status', label: isRtl ? 'الحالة' : 'Status' },
    ];
    convertToCSVAndDownload(filtered, headers, `volunteers_region_${currentRegion}`);
  };

  const handleExportActivities = () => {
    const headers = [
      { key: 'title', label: isRtl ? 'عنوان النشاط' : 'Activity Title' },
      { key: 'type', label: isRtl ? 'النوع' : 'Category' },
      { key: 'location', label: isRtl ? 'مكان التنفيذ' : 'Location' },
      { key: 'date', label: isRtl ? 'التاريخ' : 'Date' },
      { key: 'childrenCount', label: isRtl ? 'عدد الأطفال المستفيدين' : 'Beneficiary Kids' },
      { key: 'volunteersCount', label: isRtl ? 'عدد المتطوعين الجاهزين' : 'Volunteers count' },
      { key: 'description', label: isRtl ? 'توصيف الفعالية' : 'Description' },
    ];
    convertToCSVAndDownload(activities, headers, 'activities_logs');
  };

  return (
    <div className="space-y-6">
      {/* EXPORT PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleExportAllVolunteers}
          className="flex items-center justify-center gap-3 px-5 py-3.5 bg-slate-900 border border-white/10 rounded-2xl text-sm font-semibold hover:bg-slate-800 transition cursor-pointer text-emerald-400"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>{t.exportAll}</span>
        </button>

        {currentRegion !== 'all' && (
          <button
            onClick={handleExportFilteredVolunteers}
            className="flex items-center justify-center gap-3 px-5 py-3.5 bg-slate-900 border border-white/10 rounded-2xl text-sm font-semibold hover:bg-slate-800 transition cursor-pointer text-purple-400"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>{t.exportRegion}</span>
          </button>
        )}

        <button
          onClick={handleExportActivities}
          className="flex items-center justify-center gap-3 px-5 py-3.5 bg-slate-900 border border-white/10 rounded-2xl text-sm font-semibold hover:bg-slate-800 transition cursor-pointer text-blue-400"
        >
          <Download className="w-4 h-4 text-blue-400" />
          <span>{t.exportActivities}</span>
        </button>
      </div>

      {/* IMPORT (DRAG & DROP) */}
      <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
        <h3 className="text-md font-bold mb-4 flex items-center gap-2">
          <span>{t.excelImportExport}</span>
        </h3>

        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition cursor-pointer ${
            dragActive ? 'border-purple-500 bg-purple-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleInputChange}
            className="hidden"
          />
          <Upload className={`w-10 h-10 mb-3 ${dragActive ? 'text-purple-400 animate-bounce' : 'text-slate-500'}`} />
          <p className="text-sm font-semibold mb-1 text-center">{fileName || t.dropExcel}</p>
          <p className="text-xs text-slate-500 text-center">{t.supportedFormats}</p>
        </div>

        {/* ERROR BOX */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">{error}</p>
          </div>
        )}

        {/* METADATA COLS AUTO-MAPPING */}
        {previewRows.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-white/5 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">{t.autoMapping}</p>
              <p className="text-xs text-slate-300">{t.autoMappingDesc}</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded border border-white/5">
                  <span className={detectedColumns['fullName'] ? 'text-emerald-400' : 'text-amber-500'}>
                    {detectedColumns['fullName'] ? '●' : '○'}
                  </span>
                  <span>الاسم {detectedColumns['fullName'] ? `(${detectedColumns['fullName']})` : 'مفقود'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded border border-white/5">
                  <span className={detectedColumns['nationalId'] ? 'text-emerald-400' : 'text-amber-500'}>
                    {detectedColumns['nationalId'] ? '●' : '○'}
                  </span>
                  <span>رقم الهوية {detectedColumns['nationalId'] ? `(${detectedColumns['nationalId']})` : 'مفقود'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded border border-white/5">
                  <span className={detectedColumns['phone'] ? 'text-emerald-400' : 'text-slate-500'}>
                    {detectedColumns['phone'] ? '●' : '○'}
                  </span>
                  <span>رقم الهاتف {detectedColumns['phone'] ? `(${detectedColumns['phone']})` : 'مكتشف تلقائي'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded border border-white/5">
                  <span className={detectedColumns['regionId'] ? 'text-emerald-400' : 'text-slate-500'}>
                    {detectedColumns['regionId'] ? '●' : '○'}
                  </span>
                  <span>المنطقة {detectedColumns['regionId'] ? `(${detectedColumns['regionId']})` : 'مكتشف تلقائي'}</span>
                </div>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="overflow-x-auto border border-white/5 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#1e293b] text-slate-300">
                  <tr>
                    {previewRows[0].map((col, idx) => (
                      <th key={idx} className="p-2.5 font-bold border-b border-white/10">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-slate-950/40 text-slate-400">
                  {previewRows.slice(1).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-white/5 border-b border-white/5">
                      {row.map((col, cIdx) => (
                        <td key={cIdx} className="p-2.5">{col}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* REFRESH/IMPORT BUTTONS */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setPreviewRows([]);
                  setFileName('');
                  setDetectedColumns({});
                }}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={triggerSubmitImport}
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                )}
                <span>{loading ? t.importing : t.importBtn}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
