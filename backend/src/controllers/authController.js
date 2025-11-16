import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import validator from 'validator';
import { validatePasswordStrength, checkPasswordForUserInfo } from '../utils/passwordValidation.js';

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Validate name (sanitize and check length)
    const sanitizedName = validator.trim(name);
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 100 characters',
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.error,
      });
    }

    // Check if password contains user information
    const userInfoCheck = checkPasswordForUserInfo(password, sanitizedName, email);
    if (!userInfoCheck.valid) {
      return res.status(400).json({
        success: false,
        message: userInfoCheck.error,
      });
    }

    // Validate role (prevent role escalation)
    const allowedRoles = ['user', 'rescuer'];
    const userRole = role && allowedRoles.includes(role) ? role : 'user';

    // Check if user already exists
    let user = await User.findOne({ email: validator.normalizeEmail(email) });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user
    user = await User.create({
      name: sanitizedName,
      email: validator.normalizeEmail(email),
      password,
      role: userRole,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Normalize email
    const normalizedEmail = validator.normalizeEmail(email);

    // Check for admin first
    let admin = await Admin.findOne({ email: normalizedEmail }).select('+password');
    if (admin) {
      // Check if admin is active
      if (!admin.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Admin account is deactivated',
        });
      }
      
      const isMatch = await admin.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
      const token = generateToken(admin._id);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: 'admin',
        },
      });
    }

    // Check for user
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // Don't expose internal error details
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.',
    });
  }
};

export const getMe = async (req, res, next) => {
  try {
    // Check if user is admin (from middleware)
    if (req.user.role === 'admin') {
      const admin = await Admin.findById(req.user._id || req.user.id);
      if (admin) {
        return res.status(200).json({
          success: true,
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: 'admin',
            phone: admin.phone,
            is_active: admin.is_active,
            is_verified: admin.is_verified,
          },
        });
      }
    }

    // Otherwise, get regular user
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile_image: user.profile_image,
        bio: user.bio,
        address: user.address,
        is_verified: user.is_verified,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
