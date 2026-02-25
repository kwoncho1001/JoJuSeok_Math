import { create } from 'zustand';
import type { QuestionDBItem, TransactionLogItem, ProgressMasterItem, ScoredStudent, StudentResponseRaw, TextbookResponseRaw, AnalysisConfig, ClassificationCsvItem, ClassificationTree } from '../types';

interface FileData<T> {
  file: File | null;
  data: T[] | null;
  name: string;
}

const DEFAULT_CONFIG: AnalysisConfig = {
  minTestCount: 1,
  recentCount: 5,
  weights: { '상': 1.2, '중': 1.0, '하': 0.8 },
  difficultyRatio: { '상': 1, '중': 1, '하': 1 },
  selectedSubUnits: [],
};

interface AppState {
  // File Data
  questionDb: FileData<QuestionDBItem>;
  studentResponse: FileData<StudentResponseRaw>;
  textbookResponse: FileData<TextbookResponseRaw>;
  transactionLog: FileData<TransactionLogItem>;
  progressMaster: FileData<ProgressMasterItem>;
  classificationCsv: FileData<ClassificationCsvItem>;
  
  setQuestionDb: (data: FileData<QuestionDBItem>) => void;
  setStudentResponse: (data: FileData<StudentResponseRaw>) => void;
  setTextbookResponse: (data: FileData<TextbookResponseRaw>) => void;
  setTransactionLog: (data: FileData<TransactionLogItem>) => void;
  setProgressMaster: (data: FileData<ProgressMasterItem>) => void;
  setClassificationCsv: (data: FileData<ClassificationCsvItem>) => void;

  // Analysis Config
  analysisConfig: AnalysisConfig;
  setAnalysisConfig: (config: AnalysisConfig | ((prev: AnalysisConfig) => AnalysisConfig)) => void;

  // Processed Data
  classificationTree: ClassificationTree;
  setClassificationTree: (tree: ClassificationTree) => void;
  newTransactionLog: TransactionLogItem[];
  setNewTransactionLog: (log: TransactionLogItem[]) => void;
  newProgressMaster: ProgressMasterItem[];
  setNewProgressMaster: (master: ProgressMasterItem[]) => void;
  examScoreReport: ScoredStudent[];
  setExamScoreReport: (report: ScoredStudent[]) => void;

  // Selection State
  selectedGrade: string | null;
  setSelectedGrade: (grade: string | null) => void;
  selectedStudent: string | null;
  setSelectedStudent: (student: string | null) => void;
  selectedSubject: string;
  setSelectedSubject: (subject: string) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
  syncStatus: { message: string; type: 'success' | 'error' } | null;
  setSyncStatus: (status: { message: string; type: 'success' | 'error' } | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  isProcessed: boolean;
  setIsProcessed: (processed: boolean) => void;

  mainTab: 'analyzer' | 'generator';
  setMainTab: (tab: 'analyzer' | 'generator') => void;
  analyzerTab: 'dashboard' | 'report' | 'analysis';
  setAnalyzerTab: (tab: 'dashboard' | 'report' | 'analysis') => void;
}

export const useAppStore = create<AppState>((set) => ({
  questionDb: { file: null, data: null, name: 'Question_DB' },
  studentResponse: { file: null, data: null, name: 'Student_Response' },
  textbookResponse: { file: null, data: null, name: 'Textbook_Response' },
  transactionLog: { file: null, data: null, name: 'Transaction_Log' },
  progressMaster: { file: null, data: null, name: 'Progress_Master' },
  classificationCsv: { file: null, data: null, name: 'Classification_CSV' },

  setQuestionDb: (data) => set({ questionDb: data }),
  setStudentResponse: (data) => set({ studentResponse: data }),
  setTextbookResponse: (data) => set({ textbookResponse: data }),
  setTransactionLog: (data) => set({ transactionLog: data }),
  setProgressMaster: (data) => set({ progressMaster: data }),
  setClassificationCsv: (data) => set({ classificationCsv: data }),

  analysisConfig: (() => {
    try {
      const savedConfig = localStorage.getItem('analysisConfig');
      const parsed = savedConfig ? JSON.parse(savedConfig) : {};
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch {
      return DEFAULT_CONFIG;
    }
  })(),
  setAnalysisConfig: (config) => set((state) => {
    const newConfig = typeof config === 'function' ? config(state.analysisConfig) : config;
    try {
      localStorage.setItem('analysisConfig', JSON.stringify(newConfig));
    } catch (e) {
      console.error("Failed to save settings to local storage:", e);
    }
    return { analysisConfig: newConfig };
  }),

  classificationTree: new Map(),
  setClassificationTree: (tree) => set({ classificationTree: tree }),
  newTransactionLog: [],
  setNewTransactionLog: (log) => set({ newTransactionLog: log }),
  newProgressMaster: [],
  setNewProgressMaster: (master) => set({ newProgressMaster: master }),
  examScoreReport: [],
  setExamScoreReport: (report) => set({ examScoreReport: report }),

  selectedGrade: null,
  setSelectedGrade: (grade) => set({ selectedGrade: grade }),
  selectedStudent: null,
  setSelectedStudent: (student) => set({ selectedStudent: student }),
  selectedSubject: '공통수학1',
  setSelectedSubject: (subject) => set({ selectedSubject: subject }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  isSyncing: false,
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  syncStatus: null,
  setSyncStatus: (status) => set({ syncStatus: status }),
  error: null,
  setError: (error) => set({ error }),
  isProcessed: false,
  setIsProcessed: (processed) => set({ isProcessed: processed }),

  mainTab: 'analyzer',
  setMainTab: (tab) => set({ mainTab: tab }),
  analyzerTab: 'dashboard',
  setAnalyzerTab: (tab) => set({ analyzerTab: tab }),
}));
