import { extractPlainText } from '../../../utils/extractPlainText';

describe('extractPlainText', () => {
  it('returns empty string for empty input', () => {
    expect(extractPlainText('')).toBe('');
  });

  it('passes plain text through unchanged', () => {
    expect(extractPlainText('Hello world')).toBe('Hello world');
  });

  it('strips markdown images entirely', () => {
    expect(extractPlainText('![alt text](image.png)')).toBe('');
  });

  it('keeps link text and strips url', () => {
    expect(extractPlainText('[click here](https://example.com)')).toBe('click here');
  });

  it('strips h1 heading marker', () => {
    expect(extractPlainText('# Heading 1')).toBe('Heading 1');
  });

  it('strips h2 heading marker', () => {
    expect(extractPlainText('## Heading 2')).toBe('Heading 2');
  });

  it('strips h6 heading marker', () => {
    expect(extractPlainText('###### Deep heading')).toBe('Deep heading');
  });

  it('strips bold markers', () => {
    expect(extractPlainText('**bold text**')).toBe('bold text');
  });

  it('strips italic markers', () => {
    expect(extractPlainText('*italic text*')).toBe('italic text');
  });

  it('strips inline code', () => {
    expect(extractPlainText('Use `console.log()` here')).toBe('Use  here');
  });

  it('strips unordered list dash marker', () => {
    expect(extractPlainText('- item one')).toBe('item one');
  });

  it('strips unordered list asterisk marker', () => {
    expect(extractPlainText('* item two')).toBe('item two');
  });

  it('strips unordered list plus marker', () => {
    expect(extractPlainText('+ item three')).toBe('item three');
  });

  it('strips ordered list markers', () => {
    expect(extractPlainText('1. first item')).toBe('first item');
  });

  it('strips blockquote markers', () => {
    expect(extractPlainText('> quoted text')).toBe('quoted text');
  });

  it('collapses multiple newlines to a single space', () => {
    expect(extractPlainText('line one\n\nline two')).toBe('line one line two');
  });

  it('handles a complex markdown document', () => {
    const md = '# Title\n\n**Bold** and *italic*.\n\n- item\n\n[link](https://url.com)';
    const result = extractPlainText(md);
    expect(result).toContain('Title');
    expect(result).toContain('Bold');
    expect(result).toContain('italic');
    expect(result).toContain('item');
    expect(result).toContain('link');
    expect(result).not.toMatch(/[#*[\]]/);
  });

  it('trims leading and trailing whitespace', () => {
    expect(extractPlainText('  hello  ')).toBe('hello');
  });
});
