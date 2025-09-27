import { applyPatch } from 'fast-json-patch';
import type { CanvasData } from '@/canvas/types';

export interface PatchApplicationResult {
  updated: CanvasData;
  formattedPatch: string;
}

export class CanvasPatchError extends Error {}

export function applyCanvasPatch(data: CanvasData, patchSource: string): PatchApplicationResult {
  let operations: unknown;
  try {
    operations = JSON.parse(patchSource);
  } catch (error) {
    throw new CanvasPatchError('Patch payload is not valid JSON.');
  }

  if (!Array.isArray(operations)) {
    throw new CanvasPatchError('Patch must be a JSON array of operations.');
  }

  try {
    const clone: CanvasData = JSON.parse(JSON.stringify(data));
    const result = applyPatch(clone as unknown as Record<string, unknown>, operations, true, false);
    if (result.newDocument === undefined) {
      throw new CanvasPatchError('Failed to compute patched canvas.');
    }
    return {
      updated: result.newDocument as CanvasData,
      formattedPatch: JSON.stringify(operations, null, 2)
    };
  } catch (error) {
    throw new CanvasPatchError(error instanceof Error ? error.message : 'Unknown patch error');
  }
}
