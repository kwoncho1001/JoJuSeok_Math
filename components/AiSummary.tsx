

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { ScoredStudent, ProgressMasterItem, TransactionLogItem, QuestionDBItem, AnalysisConfig } from '../types';
import { Sparkles, LoaderCircle, AlertTriangle } from 'lucide-react';
import { generateAiSummaryContent } from './Report'; // Import the utility function
import { LatexRenderer } from './LatexRenderer'; // Fix: Corrected typo in import path

interface AiSummaryProps {
  studentId: string;
  examScoreReport: ScoredStudent[];
  progressMaster: ProgressMasterItem[];
  transactionLog: TransactionLogItem[];
  questionDb: QuestionDBItem[];
  isPrinting?: boolean;
  isBulkDownloadMode?: boolean; 
  aiSummaryText?: string; // New prop for pre-generated AI summary text for printing/bulk
  isAiLoading?: boolean; // New prop for external loading state management
  aiError?: string; // New prop for external error state management
}

export const AiSummary: React.FC<AiSummaryProps> = ({ 
    studentId, examScoreReport, progressMaster, transactionLog, questionDb, isPrinting, isBulkDownloadMode,
    aiSummaryText, isAiLoading: externalIsAiLoading, aiError: externalAiError
}) => {
    // The `localSummary` state will be used for the editable textarea's value when not printing.
    const [localSummary, setLocalSummary] = useState(aiSummaryText || '');

    const dynamicTitle = "AI 종합 분석 및 학습 계획";

    // Determine effective loading and error states from props
    const isLoading = externalIsAiLoading;
    const error = externalAiError;
    const summaryToDisplay = aiSummaryText || localSummary; // Prefer prop for printing, fallback to local for edit

    // Memoized data for AI summary generation
    const memoizedDataForAi = useMemo(() => ({
        examScoreReport, progressMaster, transactionLog, questionDb
    }), [examScoreReport, progressMaster, transactionLog, questionDb]);


    // Effect for updating localSummary when aiSummaryText prop changes (e.g., after parent fetches AI summary)
    useEffect(() => {
        setLocalSummary(aiSummaryText || '');
    }, [aiSummaryText]); // Only re-run if aiSummaryText prop changes

    // No local fetching logic; rely entirely on props for loading/error status
    // The parent Report component will handle calling generateAiSummaryContent and passing down the results

    if (isLoading && !isPrinting && !isBulkDownloadMode) { 
        return (
            <div className="flex items-center justify-center p-6 bg-indigo-50 rounded-xl text-indigo-700">
                <LoaderCircle className="animate-spin w-6 h-6 mr-3" />
                AI가 학생의 리포트를 분석하고 있습니다...
            </div>
        );
    }

    if (error && !isPrinting && !isBulkDownloadMode) { 
        return (
            <div className="flex items-center p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
                <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0" />
                <p>{error}</p>
            </div>
        );
    }
    
    return (
        <div className={`p-6 bg-white rounded-xl border border-gray-200 ${isPrinting ? '' : 'shadow-sm'}`}>
            <div className="flex items-center gap-4 mb-5">
                <span className="text-xs font-bold text-white bg-indigo-600 px-3 py-1 rounded-full uppercase">
                    Core Analysis
                </span>
                <h3 className="text-xl font-bold text-gray-800 tracking-tight">
                    {dynamicTitle}
                </h3>
            </div>

            {(isPrinting || isBulkDownloadMode) ? (
                <div className="w-full min-h-[250px] p-6 bg-gray-50/50 rounded-lg text-gray-700 font-medium leading-relaxed whitespace-pre-wrap break-words border border-gray-200 border-dashed">
                    {/* Render LaTeX for printing/bulk download */}
                    <LatexRenderer text={summaryToDisplay || "AI 총평이 생성되지 않았습니다."} />
                </div>
            ) : (
                <textarea
                    value={summaryToDisplay || ''}
                    onChange={(e) => setLocalSummary(e.target.value)} // Allow editing of local summary
                    className="w-full min-h-[250px] p-4 bg-white border border-gray-200 rounded-lg shadow-inner focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-gray-700 font-medium leading-relaxed transition"
                    placeholder="AI 분석 내용을 수정하세요..."
                />
            )}

            {!isPrinting && !isBulkDownloadMode && ( 
                <div className="flex justify-between items-center mt-3 text-gray-500">
                    <p className="text-xs">* 위 내용은 직접 수정이 가능하며, 수정된 내용이 PDF에 저장됩니다.</p>
                </div>
            )}
        </div>
    );
};