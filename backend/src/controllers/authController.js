import { User, Role } from '../models/index.js';
import { generateToken } from '../middleware/auth.js';
import RBACService from '../services/RBACService.js';
import logger from '../utils/logger.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user with email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Get the default 'Free' plan as starter plan
    const { Plan } = await import('../models/index.js');
    const defaultPlan = await Plan.findOne({ where: { name: 'Free' } });
    
    const user = await User.create({
      email,
      password,
      name,
      credits: 100,
      planId: defaultPlan ? defaultPlan.id : null, // Assign default plan if available
    });

    // Auto-assign the basic 'user' role to new users
    try {
      // Find or create the 'user' role and assign it to the newly created user
      let userRole = await Role.findOne({ 
        where: { name: 'user' } 
      });
      
      // Always ensure the basic permissions are assigned to the user role
      const basicPermissions = [
        { name: 'deployment:read', description: 'Can read deployment information', resourceType: 'deployment', action: 'read' },
        { name: 'deployment:create', description: 'Can create new deployments', resourceType: 'deployment', action: 'create' },
        { name: 'test-deployment:read', description: 'Can read test deployment information', resourceType: 'test-deployment', action: 'read' },
        { name: 'test-deployment:create', description: 'Can create new test deployments', resourceType: 'test-deployment', action: 'create' },
        { name: 'user:read', description: 'Can read user information', resourceType: 'user', action: 'read' }
      ];
      
      if (!userRole) {
        // If the role doesn't exist, create it with basic permissions
        const { role: createdRole } = await RBACService.createRole('user', 'Basic user role with standard permissions', true);
        userRole = createdRole;
      }
      
      // Assign basic permissions to the user role (do this every time to ensure they're there)
      for (const permData of basicPermissions) {
        const { permission } = await RBACService.createPermission(
          permData.name,
          permData.description,
          permData.resourceType,
          permData.action,
          true // systemDefined
        );
        
        // Try to assign permission to role, ignore duplicate errors
        try {
          await RBACService.assignPermissionToRole(permission.id, userRole.id);
        } catch (assignmentError) {
          // If assignment fails because it already exists, that's fine
          if (!assignmentError.message.includes('UNIQUE constraint failed')) {
            logger.error('Error assigning permission to user role:', assignmentError.message);
          }
        }
      }
      
      if (userRole) {
        await RBACService.assignRoleToUser(user.id, userRole.id);
      }
    } catch (roleError) {
      // If role assignment fails, log the error and try to assign permissions directly
      logger.error('Error assigning default role to new user:', roleError.message);
      
      // As a fallback, try to assign necessary permissions directly to the user
      try {
        const essentialPermissions = [
          { name: 'deployment:read', description: 'Can read deployment information', resourceType: 'deployment', action: 'read' },
          { name: 'deployment:create', description: 'Can create new deployments', resourceType: 'deployment', action: 'create' },
        ];
        
        for (const permData of essentialPermissions) {
          const { permission } = await RBACService.createPermission(
            permData.name,
            permData.description,
            permData.resourceType,
            permData.action,
            true // systemDefined
          );
          
          // Find or create the permission and assign it directly to the user
          await RBACService.grantPermissionToUser(user.id, permission.id);
        }
      } catch (fallbackError) {
        logger.error('Error assigning fallback permissions to new user:', fallbackError.message);
      }
    }

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
      },
      token,
    });
  } catch (error) {
    // Handle database constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update user status and last activity
    await user.update({ status: 'online', lastActivity: new Date() });

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;

    await req.user.update({ name });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        credits: req.user.credits,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await req.user.update({ status: 'offline' });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};
