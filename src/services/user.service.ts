import { IUser, User } from '../models/user.model';
import { Category } from '../models/category.model';

const findOrCreate = async (supabaseId: string, email: string): Promise<IUser> => {
  let user = await User.findOne({ supabaseId });
  if (!user) {
    user = await User.create({ supabaseId, email });
    await Category.create({ userId: user._id, name: 'General', isDefault: true });
  }
  return user;
};

export const userService = { findOrCreate };
