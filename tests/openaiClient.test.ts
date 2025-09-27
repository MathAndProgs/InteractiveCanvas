import { describe, expect, it } from 'vitest';
import { OpenAIClient } from '@/api/OpenAIClient';

const baseResponse = {
  choices: [
    {
      message: {
        content: 'Here is an idea',
        tool_calls: [
          {
            function: {
              name: 'apply_canvas_patch',
              arguments: JSON.stringify({
                patch: JSON.stringify([{ op: 'replace', path: '/nodes/0/text', value: 'Updated' }]),
                summary: 'Update first node text'
              })
            }
          }
        ]
      }
    }
  ]
};

describe('OpenAIClient.parseResponse', () => {
  it('extracts message and patch', () => {
    const result = OpenAIClient.parseResponse(baseResponse);
    expect(result.message).toContain('Here is an idea');
    expect(result.summary).toBe('Update first node text');
    expect(result.patch).toBe(JSON.stringify([{ op: 'replace', path: '/nodes/0/text', value: 'Updated' }]));
  });

  it('throws on invalid payload', () => {
    expect(() => OpenAIClient.parseResponse({})).toThrow();
  });
});
