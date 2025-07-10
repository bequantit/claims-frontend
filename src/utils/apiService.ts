interface DocumentExportData {
  document: {
    content: string;
    title: string;
    timestamp: string;
  };
  comments: Array<{
    id: string;
    selectedText: string;
    comment: string;
    author: string;
    timestamp: string;
    position: {
      from: number;
      to: number;
    };
  }>;
  summary: {
    totalComments: number;
    authors: string[];
    createdAt: string;
  };
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Sends the exported JSON data to the configured API endpoint
 * @param exportData - The exported JSON data from the document review
 * @returns Promise with the API response
 */
export async function sendExportData(exportData: DocumentExportData): Promise<ApiResponse> {
  const apiUrl = import.meta.env.VITE_API_URL;
  const apiToken = import.meta.env.VITE_API_TOKEN;

  if (!apiUrl) {
    throw new Error('VITE_API_URL environment variable is not configured');
  }

  if (!apiToken) {
    throw new Error('VITE_API_TOKEN environment variable is not configured');
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': apiToken,
      },
      body: JSON.stringify(exportData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    
    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error('Error sending export data:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

export type { DocumentExportData, ApiResponse }; 