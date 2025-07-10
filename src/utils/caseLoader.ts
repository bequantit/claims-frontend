// Dynamic imports for analysis and summary files from each case directory
const caseFiles = {
  'EMC_vs_BRI': {
    analysis: () => import('../../data/EMC_vs_BRI/analysis_v7_gemini-2.5-pro.md?raw'),
    summary: () => import('../../data/EMC_vs_BRI/summary_v7_gemini-2.5-pro.md?raw'),
  },
  'Turner_vs_xl': {
    analysis: () => import('../../data/Turner_vs_xl/analysis_v7_gemini-2.5-pro.md?raw'),
    summary: () => import('../../data/Turner_vs_xl/summary_v7_gemini-2.5-pro.md?raw'),
  },
  'Union_vs': {
    analysis: () => import('../../data/Union_vs/analysis_v7_gemini-2.5-pro.md?raw'),
    summary: () => import('../../data/Union_vs/summary_v7_gemini-2.5-pro.md?raw'),
  },
};

export type CaseName = keyof typeof caseFiles;

export interface CaseContent {
  analysis: string;
  summary: string;
}

export const loadCaseContent = async (caseName: CaseName): Promise<string> => {
  try {
    const module = await caseFiles[caseName].analysis();
    return module.default;
  } catch (error) {
    console.error(`Failed to load analysis content for case: ${caseName}`, error);
    throw new Error(`Could not load analysis file for case: ${caseName}`);
  }
};

export const loadCaseSummary = async (caseName: CaseName): Promise<string> => {
  try {
    const module = await caseFiles[caseName].summary();
    return module.default;
  } catch (error) {
    console.error(`Failed to load summary content for case: ${caseName}`, error);
    throw new Error(`Could not load summary file for case: ${caseName}`);
  }
};

export const loadFullCaseContent = async (caseName: CaseName): Promise<CaseContent> => {
  try {
    const [analysisModule, summaryModule] = await Promise.all([
      caseFiles[caseName].analysis(),
      caseFiles[caseName].summary(),
    ]);
    
    return {
      analysis: analysisModule.default,
      summary: summaryModule.default,
    };
  } catch (error) {
    console.error(`Failed to load full content for case: ${caseName}`, error);
    throw new Error(`Could not load files for case: ${caseName}`);
  }
};

export const getCaseNames = (): CaseName[] => {
  return Object.keys(caseFiles) as CaseName[];
}; 