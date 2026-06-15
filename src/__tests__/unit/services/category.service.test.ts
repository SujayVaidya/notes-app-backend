import mongoose from 'mongoose';
import { setupDB } from '../../setup/db';
import { categoryService } from '../../../services/category.service';
import { userService } from '../../../services/user.service';
import { Category } from '../../../models/category.model';
import { Note } from '../../../models/note.model';

setupDB();

let uidSeq = 0;
const newUser = () => {
  uidSeq++;
  return userService.findOrCreate(`supa-cat-${uidSeq}`, `cat${uidSeq}@test.com`);
};

describe('categoryService.getAll', () => {
  it('returns only categories belonging to the requesting user', async () => {
    const user1 = await newUser();
    const user2 = await newUser();
    await Category.create({ userId: user1._id, name: 'Work', isDefault: false });
    await Category.create({ userId: user2._id, name: 'Personal', isDefault: false });

    const result = await categoryService.getAll(String(user1._id));
    const names = result.map((c) => c.name);
    expect(names).toContain('General');
    expect(names).toContain('Work');
    expect(names).not.toContain('Personal');
  });

  it('returns categories sorted by createdAt ascending', async () => {
    const user = await newUser();
    await Category.create({ userId: user._id, name: 'ZLast', isDefault: false });
    const all = await categoryService.getAll(String(user._id));
    expect(all[0].name).toBe('General');
  });

  it('returns an empty array when user has no categories', async () => {
    const user = await newUser();
    await Category.deleteMany({ userId: user._id });
    const result = await categoryService.getAll(String(user._id));
    expect(result).toEqual([]);
  });
});

describe('categoryService.create', () => {
  it('creates a new category for the user', async () => {
    const user = await newUser();
    const cat = await categoryService.create(String(user._id), 'Projects');
    expect(cat.name).toBe('Projects');
    expect(String(cat.userId)).toBe(String(user._id));
  });

  it('sets isDefault to false for newly created categories', async () => {
    const user = await newUser();
    const cat = await categoryService.create(String(user._id), 'Archive');
    expect(cat.isDefault).toBe(false);
  });

  it('persists the category in the database', async () => {
    const user = await newUser();
    const cat = await categoryService.create(String(user._id), 'Saved');
    const found = await Category.findById(cat._id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Saved');
  });
});

describe('categoryService.update', () => {
  it('updates the category name', async () => {
    const user = await newUser();
    const cat = await categoryService.create(String(user._id), 'Old Name');
    const updated = await categoryService.update(String(user._id), String(cat._id), 'New Name');
    expect(updated.name).toBe('New Name');
  });

  it('persists the name change in the database', async () => {
    const user = await newUser();
    const cat = await categoryService.create(String(user._id), 'Before');
    await categoryService.update(String(user._id), String(cat._id), 'After');
    const found = await Category.findById(cat._id);
    expect(found!.name).toBe('After');
  });

  it('throws 404 when category does not exist', async () => {
    const user = await newUser();
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      categoryService.update(String(user._id), fakeId, 'New')
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 404 when category belongs to a different user', async () => {
    const user1 = await newUser();
    const user2 = await newUser();
    const cat = await categoryService.create(String(user1._id), 'User1 Cat');
    await expect(
      categoryService.update(String(user2._id), String(cat._id), 'Hijacked')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('categoryService.remove', () => {
  it('deletes a non-default category', async () => {
    const user = await newUser();
    const cat = await categoryService.create(String(user._id), 'ToDelete');
    await categoryService.remove(String(user._id), String(cat._id));
    expect(await Category.findById(cat._id)).toBeNull();
  });

  it('throws 400 when attempting to delete the default category', async () => {
    const user = await newUser();
    const general = await Category.findOne({ userId: user._id, isDefault: true });
    await expect(
      categoryService.remove(String(user._id), String(general!._id))
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 404 when category does not exist', async () => {
    const user = await newUser();
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      categoryService.remove(String(user._id), fakeId)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 404 when category belongs to a different user', async () => {
    const user1 = await newUser();
    const user2 = await newUser();
    const cat = await categoryService.create(String(user1._id), 'User1 Cat');
    await expect(
      categoryService.remove(String(user2._id), String(cat._id))
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('moves notes to the General category before deletion', async () => {
    const user = await newUser();
    const general = await Category.findOne({ userId: user._id, isDefault: true });
    const other = await categoryService.create(String(user._id), 'OtherCat');

    const note = await Note.create({
      userId: user._id,
      categoryId: other._id,
      title: 'Orphan Note',
      markdownContent: '# content',
      plainTextContent: 'content',
    });

    await categoryService.remove(String(user._id), String(other._id));

    const updated = await Note.findById(note._id);
    expect(String(updated!.categoryId)).toBe(String(general!._id));
  });

  it('moves all notes in the deleted category to General', async () => {
    const user = await newUser();
    const general = await Category.findOne({ userId: user._id, isDefault: true });
    const other = await categoryService.create(String(user._id), 'Multi');

    await Note.insertMany([
      { userId: user._id, categoryId: other._id, title: 'N1', markdownContent: 'a', plainTextContent: 'a' },
      { userId: user._id, categoryId: other._id, title: 'N2', markdownContent: 'b', plainTextContent: 'b' },
    ]);

    await categoryService.remove(String(user._id), String(other._id));

    const count = await Note.countDocuments({ categoryId: general!._id, userId: user._id });
    expect(count).toBe(2);
  });
});
