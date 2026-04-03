import type { AnnotationDraft } from "../types/draft";
import { mockDraft } from "../mock/draft";
import type { ApiResult } from "./client";
import { buildApiUrl, requestJson } from "./client";

const DRAFT_STORAGE_KEY = "map-designer:draft";

function readDraftFromStorage() {
  const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AnnotationDraft;
  } catch {
    return null;
  }
}

function writeDraftToStorage(payload: AnnotationDraft) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
}

function createMockResult(data: AnnotationDraft): ApiResult<AnnotationDraft> {
  return { data, source: "mock" };
}

export async function getDraft(): Promise<ApiResult<AnnotationDraft>> {
  try {
    const data = await requestJson<AnnotationDraft>("/api/v1/draft");
    writeDraftToStorage(data);
    return { data, source: "api" };
  } catch {
    const local = readDraftFromStorage();
    if (local) {
      return createMockResult(local);
    }

    return createMockResult(structuredClone(mockDraft));
  }
}

export async function saveDraft(payload: AnnotationDraft): Promise<ApiResult<AnnotationDraft>> {
  try {
    const data = await requestJson<AnnotationDraft>("/api/v1/draft", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    writeDraftToStorage(data);
    return { data, source: "api" };
  } catch {
    writeDraftToStorage(payload);
    return createMockResult(payload);
  }
}

export async function downloadDraftExport(filename = "map-annotation-draft") {
  try {
    const response = await fetch(buildApiUrl("/api/v1/draft/export"));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filename}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    const fallback = readDraftFromStorage() ?? structuredClone(mockDraft);
    const blob = new Blob([JSON.stringify(fallback, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filename}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }
}
