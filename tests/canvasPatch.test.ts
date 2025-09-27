import { describe, expect, it } from 'vitest';
import { applyCanvasPatch, CanvasPatchError } from '@/canvas/canvasPatch';
import type { CanvasData } from '@/canvas/types';

const sampleCanvas: CanvasData = {
  nodes: [
    {
      id: '1',
      type: 'text',
      text: 'Hello',
      x: 0,
      y: 0,
      width: 100,
      height: 100
    }
  ],
  edges: []
};

describe('applyCanvasPatch', () => {
  it('applies valid patch', () => {
    const patch = JSON.stringify([
      {
        op: 'replace',
        path: '/nodes/0/text',
        value: 'Hello world'
      }
    ]);

    const result = applyCanvasPatch(sampleCanvas, patch);
    expect(result.updated.nodes[0].text).toBe('Hello world');
  });

  it('throws for invalid json', () => {
    expect(() => applyCanvasPatch(sampleCanvas, 'not json')).toThrow(CanvasPatchError);
  });

  it('throws for non-array patch', () => {
    expect(() => applyCanvasPatch(sampleCanvas, '{}')).toThrow(CanvasPatchError);
  });
});
