import { setupDB } from '../../setup/db';
import { userService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { Category } from '../../../models/category.model';

setupDB();

describe('userService.findOrCreate', () => {
  it('creates a new user when one does not exist', async () => {
    const user = await userService.findOrCreate('supa-001', 'test@example.com');
    expect(user.supabaseId).toBe('supa-001');
    expect(user.email).toBe('test@example.com');
    const inDb = await User.findOne({ supabaseId: 'supa-001' });
    expect(inDb).not.toBeNull();
  });

  it('creates a default General category for a new user', async () => {
    const user = await userService.findOrCreate('supa-002', 'new@example.com');
    const category = await Category.findOne({ userId: user._id });
    expect(category).not.toBeNull();
    expect(category!.name).toBe('General');
    expect(category!.isDefault).toBe(true);
  });

  it('returns the existing user on subsequent calls', async () => {
    await userService.findOrCreate('supa-003', 'existing@example.com');
    const user2 = await userService.findOrCreate('supa-003', 'existing@example.com');
    expect(user2.supabaseId).toBe('supa-003');
    const count = await User.countDocuments({ supabaseId: 'supa-003' });
    expect(count).toBe(1);
  });

  it('does not create a duplicate General category for an existing user', async () => {
    const user = await userService.findOrCreate('supa-004', 'dup@example.com');
    await userService.findOrCreate('supa-004', 'dup@example.com');
    const count = await Category.countDocuments({ userId: user._id });
    expect(count).toBe(1);
  });

  it('stores email in lowercase due to schema setting', async () => {
    const user = await userService.findOrCreate('supa-005', 'UPPER@EXAMPLE.COM');
    expect(user.email).toBe('upper@example.com');
  });

  it('creates separate users for different supabaseIds', async () => {
    await userService.findOrCreate('supa-006', 'a@example.com');
    await userService.findOrCreate('supa-007', 'b@example.com');
    const count = await User.countDocuments();
    expect(count).toBe(2);
  });
});
