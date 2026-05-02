import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { MESSAGES } from '../constants/messages';
import { userService } from '../services/user.service';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: MESSAGES.AUTH.TOKEN_MISSING });
      return;
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ success: false, message: MESSAGES.AUTH.TOKEN_INVALID });
      return;
    }

    const { id: supabaseId, email } = data.user;
    const user = await userService.findOrCreate(supabaseId, email!);

    req.user = { userId: String(user._id), email: user.email };
    next();
  } catch {
    res.status(401).json({ success: false, message: MESSAGES.AUTH.TOKEN_INVALID });
  }
};
