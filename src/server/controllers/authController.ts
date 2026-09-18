import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.ts';
import { generateToken, AuthRequest } from '../middleware/auth.ts';
import { createAuditLog } from '../services/auditService.ts';

export async function login(req: Request, res: Response) {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username/email and password',
      });
    }

    // Support login by email OR username (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier },
        { username: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your username and password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your username and password.',
      });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact company admin.',
      });
    }

    const token = generateToken(user);

    await createAuditLog({
      userId: user._id.toString(),
      userName: user.name,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id.toString(),
      description: `User ${user.email} (${user.role}) logged in successfully`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username || 'Sudarshan5353',
        email: user.email,
        role: user.role,
        phone: user.phone,
        securityQuestion: user.securityQuestion,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Login failed',
    });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username || 'Sudarshan5353',
        email: user.email,
        role: user.role,
        phone: user.phone,
        securityQuestion: user.securityQuestion,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Step 1: Request Password Recovery Code
 * Public endpoint: POST /api/auth/forgot-password/request
 */
export async function forgotPasswordRequest(req: Request, res: Response) {
  try {
    const { identifier } = req.body;
    const cleanId = (identifier || '').trim();

    if (!cleanId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered username or email address.',
      });
    }

    const user = await User.findOne({
      $or: [
        { email: cleanId.toLowerCase() },
        { username: cleanId },
        { username: cleanId.toLowerCase() },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account registered under this username or email.',
      });
    }

    // Generate 6-digit random verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    // Helper mask for privacy
    const maskedEmail = user.email.replace(/(.{2})(.*)(?=@)/, (_gp1, gp2, gp3) => gp2 + '*'.repeat(Math.max(1, gp3.length)));
    const maskedPhone = user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : '+91 77****3434';

    await createAuditLog({
      userId: user._id.toString(),
      userName: user.name,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user._id.toString(),
      description: `Password recovery code requested for ${user.email} (${user.username})`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Verification code generated successfully.',
      username: user.username,
      maskedEmail,
      maskedPhone,
      securityQuestion: user.securityQuestion || 'Primary Master Security PIN',
      code: otp, // Provided for instant preview testing and developer ease
      masterPin: '5353',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to process password recovery request.',
    });
  }
}

/**
 * Step 2: Verify Code and Reset Password
 * Public endpoint: POST /api/auth/forgot-password/reset
 */
export async function forgotPasswordReset(req: Request, res: Response) {
  try {
    const { identifier, otp, newPassword } = req.body;
    const cleanId = (identifier || '').trim();
    const cleanOtp = (otp || '').trim();
    const cleanPass = (newPassword || '').trim();

    if (!cleanId || !cleanOtp || !cleanPass) {
      return res.status(400).json({
        success: false,
        message: 'Please provide identifier, verification code, and new password.',
      });
    }

    if (cleanPass.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 4 characters long.',
      });
    }

    const user = await User.findOne({
      $or: [
        { email: cleanId.toLowerCase() },
        { username: cleanId },
        { username: cleanId.toLowerCase() },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // Verify OTP code or Master Admin Recovery PIN (5353 / Arambh5353)
    const isMasterPin = cleanOtp === '5353' || cleanOtp.toUpperCase() === 'ARAMBH5353';
    const isSecurityAnswer = user.securityAnswer && cleanOtp.toLowerCase() === user.securityAnswer.toLowerCase().trim();
    const isValidOtp =
      user.resetOtp &&
      user.resetOtp === cleanOtp &&
      user.resetOtpExpiry &&
      user.resetOtpExpiry > new Date();

    if (!isMasterPin && !isSecurityAnswer && !isValidOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired recovery code/PIN. Please try again or use master PIN 5353.',
      });
    }

    // Hash new password and save
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(cleanPass, salt);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    await createAuditLog({
      userId: user._id.toString(),
      userName: user.name,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: user._id.toString(),
      description: `Password reset successfully completed for ${user.email} (${user.username})`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Your password has been successfully reset! You can now sign in with your new password.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to reset password.',
    });
  }
}

/**
 * Update Admin Profile & Username
 * Protected endpoint: PUT /api/admin/profile
 */
export async function updateAdminProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { name, username, email, phone, securityQuestion, securityAnswer } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check unique username if updated
    if (username && username.trim() !== user.username) {
      const trimmedUser = username.trim();
      const existingUser = await User.findOne({
        username: trimmedUser,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: `Username '${trimmedUser}' is already taken by another account. Please choose a different one.`,
        });
      }
      user.username = trimmedUser;
    }

    // Check unique email if updated
    if (email && email.toLowerCase().trim() !== user.email) {
      const trimmedEmail = email.toLowerCase().trim();
      const existingEmail = await User.findOne({
        email: trimmedEmail,
        _id: { $ne: user._id },
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: `Email '${trimmedEmail}' is already registered with another account.`,
        });
      }
      user.email = trimmedEmail;
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (securityQuestion) user.securityQuestion = securityQuestion.trim();
    if (securityAnswer) user.securityAnswer = securityAnswer.trim();

    await user.save();

    await createAuditLog({
      userId: user._id.toString(),
      userName: user.name,
      action: 'ADMIN_PROFILE_UPDATED',
      entityType: 'User',
      entityId: user._id.toString(),
      description: `Admin profile & credentials updated (Username: ${user.username}, Email: ${user.email})`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Admin profile and username updated successfully.',
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        securityQuestion: user.securityQuestion,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to update profile.',
    });
  }
}

/**
 * Change Admin Password
 * Protected endpoint: PUT /api/admin/change-password
 */
export async function changeAdminPassword(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 4 characters long.',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match.',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If current password provided, verify it
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match existing records.',
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword.trim(), salt);
    await user.save();

    await createAuditLog({
      userId: user._id.toString(),
      userName: user.name,
      action: 'ADMIN_PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user._id.toString(),
      description: `Admin password updated successfully for ${user.username || user.email}`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Admin password changed successfully! Your new password is now active.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to change password.',
    });
  }
}
