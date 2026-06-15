import { createNoteSchema, updateNoteSchema, moveNoteSchema } from '../../../validators/note.validator';

const validObjectId = '507f1f77bcf86cd799439011';

describe('createNoteSchema', () => {
  const valid = {
    title: 'My Note',
    markdownContent: '# Hello world',
    categoryId: validObjectId,
  };

  it('accepts valid note data', () => {
    expect(() => createNoteSchema.parse(valid)).not.toThrow();
  });

  it('rejects when title is missing', () => {
    const { title: _, ...rest } = valid;
    expect(() => createNoteSchema.parse(rest)).toThrow();
  });

  it('rejects an empty title', () => {
    expect(() => createNoteSchema.parse({ ...valid, title: '' })).toThrow();
  });

  it('rejects title longer than 150 characters', () => {
    expect(() => createNoteSchema.parse({ ...valid, title: 'A'.repeat(151) })).toThrow();
  });

  it('accepts title at boundary of 150 characters', () => {
    expect(() => createNoteSchema.parse({ ...valid, title: 'A'.repeat(150) })).not.toThrow();
  });

  it('rejects when markdownContent is missing', () => {
    const { markdownContent: _, ...rest } = valid;
    expect(() => createNoteSchema.parse(rest)).toThrow();
  });

  it('rejects an empty markdownContent', () => {
    expect(() => createNoteSchema.parse({ ...valid, markdownContent: '' })).toThrow();
  });

  it('rejects when categoryId is missing', () => {
    const { categoryId: _, ...rest } = valid;
    expect(() => createNoteSchema.parse(rest)).toThrow();
  });

  it('rejects an empty categoryId', () => {
    expect(() => createNoteSchema.parse({ ...valid, categoryId: '' })).toThrow();
  });
});

describe('updateNoteSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(() => updateNoteSchema.parse({})).not.toThrow();
  });

  it('accepts update with only title', () => {
    expect(() => updateNoteSchema.parse({ title: 'New Title' })).not.toThrow();
  });

  it('accepts update with only markdownContent', () => {
    expect(() => updateNoteSchema.parse({ markdownContent: '# Updated' })).not.toThrow();
  });

  it('accepts update with both fields', () => {
    expect(() => updateNoteSchema.parse({ title: 'New', markdownContent: '# New' })).not.toThrow();
  });

  it('rejects empty string for markdownContent', () => {
    expect(() => updateNoteSchema.parse({ markdownContent: '' })).toThrow();
  });

  it('rejects title longer than 150 characters', () => {
    expect(() => updateNoteSchema.parse({ title: 'T'.repeat(151) })).toThrow();
  });
});

describe('moveNoteSchema', () => {
  it('accepts a valid categoryId', () => {
    expect(() => moveNoteSchema.parse({ categoryId: validObjectId })).not.toThrow();
  });

  it('rejects when categoryId is missing', () => {
    expect(() => moveNoteSchema.parse({})).toThrow();
  });

  it('rejects an empty categoryId', () => {
    expect(() => moveNoteSchema.parse({ categoryId: '' })).toThrow();
  });
});
