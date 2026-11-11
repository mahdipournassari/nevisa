import type { GenerationResult } from './generator';

export function rowToResult(row: {
  id?: string;
  result_text: string;
  template_id: string;
  topic: string;
  tone: string;
  length: string;
  created_at: string;
}): GenerationResult {
  return {
    id: row.id,
    text: row.result_text,
    templateId: row.template_id,
    topic: row.topic,
    tone: row.tone as GenerationResult['tone'],
    length: row.length as GenerationResult['length'],
    createdAt: new Date(row.created_at).getTime(),
  };
}


export async function fetchHistory(authToken: string): Promise<GenerationResult[]> {
  try {
    const response = await fetch('/api/history', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.items || []).map(rowToResult);
  } catch {
    return [];
  }
}

export async function deleteHistoryItem(id: string, authToken: string): Promise<void> {
  try {
    await fetch(`/api/history/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
  } catch {
    // ignore
  }
}

export async function clearAllHistory(authToken: string): Promise<void> {
  try {
    await fetch('/api/history', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
  } catch {
    // ignore
  }
}
