import { createCategorySchema, updateCategorySchema } from '../../../validators/category.validator';

describe('createCategorySchema', () => {
  it('accepts a valid name', () => {
    expect(() => createCategorySchema.parse({ name: 'Work' })).not.toThrow();
  });

  it('rejects a name shorter than 2 characters', () => {
    expect(() => createCategorySchema.parse({ name: 'A' })).toThrow();
  });

  it('rejects a name longer than 50 characters', () => {
    expect(() => createCategorySchema.parse({ name: 'A'.repeat(51) })).toThrow();
  });

  it('rejects when name is missing', () => {
    expect(() => createCategorySchema.parse({})).toThrow();
  });

  it('rejects a non-string name', () => {
    expect(() => createCategorySchema.parse({ name: 42 })).toThrow();
  });

  it('accepts name at lower boundary of 2 chars', () => {
    expect(() => createCategorySchema.parse({ name: 'AB' })).not.toThrow();
  });

  it('accepts name at upper boundary of 50 chars', () => {
    expect(() => createCategorySchema.parse({ name: 'A'.repeat(50) })).not.toThrow();
  });
});

describe('updateCategorySchema', () => {
  it('accepts a valid name', () => {
    expect(() => updateCategorySchema.parse({ name: 'Updated Name' })).not.toThrow();
  });

  it('rejects a name shorter than 2 characters', () => {
    expect(() => updateCategorySchema.parse({ name: 'X' })).toThrow();
  });

  it('rejects a name longer than 50 characters', () => {
    expect(() => updateCategorySchema.parse({ name: 'B'.repeat(51) })).toThrow();
  });

  it('rejects when name is missing', () => {
    expect(() => updateCategorySchema.parse({})).toThrow();
  });
});
