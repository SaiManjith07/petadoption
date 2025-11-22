import User from '../models/User.js';
import validator from 'validator';

/**
 * Update user profile
 */
export const updateUser = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, email, phone, bio, address } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken',
        });
      }
      user.email = email;
    }

    // Update fields
    if (name) user.name = validator.trim(name);
    if (phone !== undefined) user.phone = validator.trim(phone) || null;
    if (bio !== undefined) user.bio = validator.trim(bio) || null;
    if (address) {
      user.address = {
        city: address.city ? validator.trim(address.city) : user.address?.city || '',
        state: address.state ? validator.trim(address.state) : user.address?.state || '',
        country: address.country ? validator.trim(address.country) : user.address?.country || '',
        pincode: address.pincode ? validator.trim(address.pincode) : user.address?.pincode || '',
        full_address: address.full_address ? validator.trim(address.full_address) : user.address?.full_address || '',
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
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

/**
 * Get user by ID
 */
export const getUser = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user._id || req.user.id;

    const user = await User.findById(userId).select('-password');
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
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

