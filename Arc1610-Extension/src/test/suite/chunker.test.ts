import { approximateTokenCount, chunkText, shouldChunkFile } from '../../indexing/chunker';

describe('Chunker Module', () => {
  describe('approximateTokenCount', () => {
    it('should estimate ~4 chars per token', () => {
      expect(approximateTokenCount('1234')).toBe(1);
      expect(approximateTokenCount('12345678')).toBe(2);
      expect(approximateTokenCount('')).toBe(0);
    });
  });

  describe('shouldChunkFile', () => {
    it('should ignore empty files', () => {
      expect(shouldChunkFile('test.ts', '')).toBe(false);
    });

    it('should ignore extremely large files', () => {
      const hugeContent = 'a'.repeat(1_000_001);
      expect(shouldChunkFile('test.ts', hugeContent)).toBe(false);
    });

    it('should ignore files without extensions', () => {
      expect(shouldChunkFile('LICENSE', 'some content')).toBe(false);
      expect(shouldChunkFile('Makefile', 'some content')).toBe(false);
    });

    it('should accept valid source files', () => {
      expect(shouldChunkFile('test.ts', 'const a = 1;')).toBe(true);
      expect(shouldChunkFile('.gitignore', 'node_modules/')).toBe(true);
    });
  });

  describe('chunkText', () => {
    it('should handle empty text gracefully', () => {
      const chunks = Array.from(chunkText(''));
      expect(chunks.length).toBe(0);
    });

    it('should return a single chunk for small text', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const chunks = Array.from(chunkText(text, 50, 0));
      expect(chunks.length).toBe(1);
      expect(chunks[0].content).toBe(text);
      expect(chunks[0].startLine).toBe(0);
      expect(chunks[0].endLine).toBe(2);
    });

    it('should split large text into overlapping chunks', () => {
      const lines = Array.from({ length: 20 }, (_, i) => `This is line number ${i}`);
      const text = lines.join('\n');
      
      // Force small chunks to ensure splitting
      // Each line is ~23 chars = 6 tokens. Let max chunk be 30 tokens (~5 lines)
      const chunks = Array.from(chunkText(text, 30, 2)); // 2 lines overlap
      
      expect(chunks.length).toBeGreaterThan(1);
      
      // Check overlap between first and second chunk
      const firstChunkLines = chunks[0].content.split('\n');
      const secondChunkLines = chunks[1].content.split('\n');
      
      // Last 2 lines of first chunk should be first 2 lines of second chunk
      expect(firstChunkLines.slice(-2)).toEqual(secondChunkLines.slice(0, 2));
      
      // Check line metadata
      expect(chunks[0].startLine).toBe(0);
      expect(chunks[1].startLine).toBe(chunks[0].endLine - 1); // because of 2 overlap lines
    });
  });
});
