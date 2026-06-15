import mongoose from 'mongoose';
import { setupDB } from '../../setup/db';
import { noteService } from '../../../services/note.service';
import { categoryService } from '../../../services/category.service';
import { userService } from '../../../services/user.service';
import { Note } from '../../../models/note.model';
import { Category } from '../../../models/category.model';

setupDB();

let uidSeq = 0;
const newUser = () => {
  uidSeq++;
  return userService.findOrCreate(`supa-note-${uidSeq}`, `note${uidSeq}@test.com`);
};

const getGeneral = (userId: mongoose.Types.ObjectId | string) =>
  Category.findOne({ userId, isDefault: true });

describe('noteService.create', () => {
  it('creates a note and stores raw markdown', async () => {
    const user = await newUser();
    const cat = await getGeneral(user._id);
    const note = await noteService.create(String(user._id), {
      title: 'My Note',
      noteType: 'markdown', markdownContent:'# Hello',
      categoryId: String(cat!._id),
    });
    expect(note.title).toBe('My Note');
    expect(note.markdownContent).toBe('# Hello');
  });

  it('extracts and stores plain text on creation', async () => {
    const user = await newUser();
    const cat = await getGeneral(user._id);
    const note = await noteService.create(String(user._id), {
      title: 'Formatted',
      noteType: 'markdown', markdownContent:'# Hello **World**',
      categoryId: String(cat!._id),
    });
    expect(note.plainTextContent).toBe('Hello World');
  });

  it('throws 404 when category does not exist', async () => {
    const user = await newUser();
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      noteService.create(String(user._id), { title: 'x', noteType: 'markdown', markdownContent:'x', categoryId: fakeId })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 when using another user's category", async () => {
    const user1 = await newUser();
    const user2 = await newUser();
    const cat1 = await getGeneral(user1._id);
    await expect(
      noteService.create(String(user2._id), {
        title: 'x',
        noteType: 'markdown', markdownContent:'x',
        categoryId: String(cat1!._id),
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('assigns userId and categoryId to the note', async () => {
    const user = await newUser();
    const cat = await getGeneral(user._id);
    const note = await noteService.create(String(user._id), {
      title: 'Ownership Test',
      noteType: 'markdown', markdownContent:'# x',
      categoryId: String(cat!._id),
    });
    expect(String(note.userId)).toBe(String(user._id));
    expect(String(note.categoryId)).toBe(String(cat!._id));
  });
});

describe('noteService.getAll', () => {
  it('returns notes for the user with pagination metadata', async () => {
    const user = await newUser();
    const cat = await getGeneral(user._id);
    for (let i = 0; i < 3; i++) {
      await noteService.create(String(user._id), { title: `Note ${i}`, noteType: 'markdown', markdownContent:'x', categoryId: String(cat!._id) });
    }
    const result = await noteService.getAll(String(user._id), {});
    expect(result.data).toHaveLength(3);
    expect(result.pagination.total).toBe(3);
  });

  it('excludes markdownContent from list results', async () => {
    const user = await newUser();
    const cat = await getGeneral(user._id);
    await noteService.create(String(user._id), { title: 'Secret', noteType: 'markdown', markdownContent:'# private', categoryId: String(cat!._id) });
    const result = await noteService.getAll(String(user._id), {});
    expect((result.data[0] as any).markdownContent).toBeUndefined();
  });

  it('filters by categoryId when provided', async () => {
    const user = await newUser();
    const general = await getGeneral(user._id);
    const other = await categoryService.create(String(user._id), 'Other');

    await noteService.create(String(user._id), { title: 'In General', noteType: 'markdown', markdownContent:'x', categoryId: String(general!._id) });
    await noteService.create(String(user._id), { title: 'In Other', noteType: 'markdown', markdownContent:'x', categoryId: String(other._id) });

    const result = await noteService.getAll(String(user._id), { categoryId: String(other._id) });
    expect(result.data).toHaveLength(1);
    expect((result.data[0] as any).title).toBe('In Other');
  });

  it('respects page and limit pagination params', async () => {
    const user = await newUser();
    const cat = await getGeneral(user._id);
    for (let i = 0; i < 5; i++) {
      await noteService.create(String(user._id), { title: `Paged ${i}`, noteType: 'markdown', markdownContent:'x', categoryId: String(cat!._id) });
    }
    const result = await noteService.getAll(String(user._id), { page: '2', limit: '2' });
    expect(result.data).toHaveLength(2);
    expect(result.pagination).toMatchObject({ page: 2, limit: 2, total: 5, pages: 3 });
  });

  it("does not return other users' notes", async () => {
    const user1 = await newUser();
    const user2 = await newUser();
    const cat1 = await getGeneral(user1._id);
    const cat2 = await getGeneral(user2._id);
    await noteService.create(String(user1._id), { title: 'User1', noteType: 'markdown', markdownContent:'x', categoryId: String(cat1!._id) });
    await noteService.create(String(user2._id), { title: 'User2', noteType: 'markdown', markdownContent:'x', categoryId: String(cat2!._id) });

    const result = await noteService.getAll(String(user1._id), {});
    expect(result.data).toHaveLength(1);
    expect((result.data[0] as any).title).toBe('User1');
  });
});

describe('noteService.getOne', () => {
  it('returns the full note by id', async () => {
    const user = await newUser();
    const cat = await getGeneral(user._id);
    const created = await noteService.create(String(user._id), { title: 'Single', noteType: 'markdown', markdownContent:'# content', categoryId: String(cat!._id) });
    const note = await noteService.getOne(String(user._id), String(created._id));
    expect(note.title).toBe('Single');
    expect(note.markdownContent).toBe('# content');
  });

  it('throws 404 when note does not exist', async () => {
    const user = await newUser();
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(noteService.getOne(String(user._id), fakeId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 when note belongs to another user", async () => {
    const user1 = await newUser();
    const user2 = await newUser();
    const cat1 = await getGeneral(user1._id);
    const note = await noteService.create(String(user1._id), { title: 'Owned', noteType: 'markdown', markdownContent:'x', categoryId: String(cat1!._id) });
    await expect(noteService.getOne(String(user2._id), String(note._id))).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('noteService.update', () => {
  it('updates the note title', async () => {
    const user = await newUser();
    const cat = await getGeneral(user._id);
    const note = await noteService.create(String(user._id), { title: 'Old', noteType: 'markdown', markdownContent:'# x', categoryId: String(cat!._id) });
    const updated = await noteService.update(String(user._id), String(note._id), { title: 'New Title' });
    expect(updated.title).toBe('New Title');
  });

  it('updates markdownContent and recalculates plainTextContent', async () => {
    const user = await newUser();
    const cat = await getGeneral(user._id);
    const note = await noteService.create(String(user._id), { title: 'Note', noteType: 'markdown', markdownContent:'# Old', categoryId: String(cat!._id) });
    const updated = await noteService.update(String(user._id), String(note._id), { markdownContent: '# New **Content**' });
    expect(updated.markdownContent).toBe('# New **Content**');
    expect(updated.plainTextContent).toBe('New Content');
  });

  it('does not change plainTextContent when only title is updated', async () => {
    const user = await newUser();
    const cat = await getGeneral(user._id);
    const note = await noteService.create(String(user._id), { title: 'Note', noteType: 'markdown', markdownContent:'# Hello', categoryId: String(cat!._id) });
    const updated = await noteService.update(String(user._id), String(note._id), { title: 'Renamed' });
    expect(updated.plainTextContent).toBe('Hello');
  });

  it('throws 404 when note does not exist', async () => {
    const user = await newUser();
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(noteService.update(String(user._id), fakeId, { title: 'x' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 when note belongs to another user", async () => {
    const user1 = await newUser();
    const user2 = await newUser();
    const cat1 = await getGeneral(user1._id);
    const note = await noteService.create(String(user1._id), { title: 'Note', noteType: 'markdown', markdownContent:'x', categoryId: String(cat1!._id) });
    await expect(noteService.update(String(user2._id), String(note._id), { title: 'Hacked' })).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('noteService.remove', () => {
  it('deletes the note from the database', async () => {
    const user = await newUser();
    const cat = await getGeneral(user._id);
    const note = await noteService.create(String(user._id), { title: 'Delete Me', noteType: 'markdown', markdownContent:'x', categoryId: String(cat!._id) });
    await noteService.remove(String(user._id), String(note._id));
    expect(await Note.findById(note._id)).toBeNull();
  });

  it('throws 404 when note does not exist', async () => {
    const user = await newUser();
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(noteService.remove(String(user._id), fakeId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 when note belongs to another user", async () => {
    const user1 = await newUser();
    const user2 = await newUser();
    const cat1 = await getGeneral(user1._id);
    const note = await noteService.create(String(user1._id), { title: 'Note', noteType: 'markdown', markdownContent:'x', categoryId: String(cat1!._id) });
    await expect(noteService.remove(String(user2._id), String(note._id))).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('noteService.move', () => {
  it('moves the note to the target category', async () => {
    const user = await newUser();
    const general = await getGeneral(user._id);
    const other = await categoryService.create(String(user._id), 'Target');
    const note = await noteService.create(String(user._id), { title: 'Moveable', noteType: 'markdown', markdownContent:'x', categoryId: String(general!._id) });

    await noteService.move(String(user._id), String(note._id), String(other._id));

    const updated = await Note.findById(note._id);
    expect(String(updated!.categoryId)).toBe(String(other._id));
  });

  it('throws 404 when note does not exist', async () => {
    const user = await newUser();
    const general = await getGeneral(user._id);
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      noteService.move(String(user._id), fakeId, String(general!._id))
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 404 when target category does not exist', async () => {
    const user = await newUser();
    const general = await getGeneral(user._id);
    const note = await noteService.create(String(user._id), { title: 'Note', noteType: 'markdown', markdownContent:'x', categoryId: String(general!._id) });
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(
      noteService.move(String(user._id), String(note._id), fakeId)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 404 when target category belongs to another user", async () => {
    const user1 = await newUser();
    const user2 = await newUser();
    const cat1 = await getGeneral(user1._id);
    const cat2 = await getGeneral(user2._id);
    const note = await noteService.create(String(user1._id), { title: 'Note', noteType: 'markdown', markdownContent:'x', categoryId: String(cat1!._id) });
    await expect(
      noteService.move(String(user1._id), String(note._id), String(cat2!._id))
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('noteService.search', () => {
  it('returns all user notes when query is empty', async () => {
    const user = await newUser();
    const cat = await getGeneral(user._id);
    await noteService.create(String(user._id), { title: 'Alpha', noteType: 'markdown', markdownContent:'first', categoryId: String(cat!._id) });
    await noteService.create(String(user._id), { title: 'Beta', noteType: 'markdown', markdownContent:'second', categoryId: String(cat!._id) });
    const result = await noteService.search(String(user._id), {});
    expect(result.data.length).toBeGreaterThanOrEqual(2);
  });

  it('returns pagination metadata', async () => {
    const user = await newUser();
    const result = await noteService.search(String(user._id), {});
    expect(result.pagination).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      pages: expect.any(Number),
    });
  });

  it("does not return other users' notes in search results", async () => {
    const user1 = await newUser();
    const user2 = await newUser();
    const cat1 = await getGeneral(user1._id);
    const cat2 = await getGeneral(user2._id);
    await noteService.create(String(user1._id), { title: 'UserOneNote', noteType: 'markdown', markdownContent:'only for user1', categoryId: String(cat1!._id) });
    await noteService.create(String(user2._id), { title: 'UserTwoNote', noteType: 'markdown', markdownContent:'only for user2', categoryId: String(cat2!._id) });

    const result = await noteService.search(String(user1._id), {});
    const titles = result.data.map((n: any) => n.title);
    expect(titles).toContain('UserOneNote');
    expect(titles).not.toContain('UserTwoNote');
  });

  it('excludes markdownContent from search results', async () => {
    const user = await newUser();
    const result = await noteService.search(String(user._id), {});
    result.data.forEach((note: any) => {
      expect(note.markdownContent).toBeUndefined();
    });
  });
});
