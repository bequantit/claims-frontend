type CaseFile = {
  analysis: () => Promise<string>;
  summary: () => Promise<string>;
};

// Use import.meta.glob to import all markdown files as raw strings
const allMarkdownFiles = import.meta.glob('../../data/*/*.md', { as: 'raw' });

const caseFiles: Record<string, CaseFile> = {};

// Iterate over all matched files
for (const path in allMarkdownFiles) {
  // Example path: ../../data/EMC_vs_BRI/summary_v7_gemini-2.5-pro.md
  const match = path.match(/..\/..\/data\/([^/]+)\/(summary|analysis)_.*\.md/);
  if (!match) continue;

  const [, folder, type] = match; // type is "summary" or "analysis"

  // Ensure entry exists
  caseFiles[folder] ??= {} as CaseFile;

  // Assign dynamic import
  caseFiles[folder][type as 'summary' | 'analysis'] = allMarkdownFiles[path];
}


export type CaseName = keyof typeof caseFiles;

export interface CaseContent {
  analysis: string;
  summary: string;
}

export const loadCaseContent = async (caseName: CaseName): Promise<string> => {
  try {
    const module = await caseFiles[caseName].analysis();
    return module;
  } catch (error) {
    console.error(`Failed to load analysis content for case: ${caseName}`, error);
    throw new Error(`Could not load analysis file for case: ${caseName}`);
  }
};

export const loadCaseSummary = async (caseName: CaseName): Promise<string> => {
  try {
    const module = await caseFiles[caseName].summary();
    return module;
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
      analysis: analysisModule,
      summary: summaryModule,
    };
  } catch (error) {
    console.error(`Failed to load full content for case: ${caseName}`, error);
    throw new Error(`Could not load files for case: ${caseName}`);
  }
};

export const getCaseNames = (): CaseName[] => {
  return Object.keys(caseFiles) as CaseName[];
}; 