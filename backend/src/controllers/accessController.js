import { AccessGrant, User } from '../models/index.js';

export const grantAccess = async (req, res, next) => {
  try {
    const { userId, resourceType, resourceId, permissions, expiresAt } = req.body;

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accessGrant = await AccessGrant.create({
      userId,
      resourceType,
      resourceId,
      permissions,
      expiresAt,
      grantedBy: req.user.id,
    });

    res.status(201).json({
      message: 'Access granted successfully',
      accessGrant,
    });
  } catch (error) {
    next(error);
  }
};

export const revokeAccess = async (req, res, next) => {
  try {
    const { id } = req.params;

    const accessGrant = await AccessGrant.findByPk(id);

    if (!accessGrant) {
      return res.status(404).json({ error: 'Access grant not found' });
    }

    await accessGrant.destroy();

    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAccessGrants = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const where = userId ? { userId } : {};

    const accessGrants = await AccessGrant.findAll({
      where,
      include: [
        { model: User, as: 'User' },
      ],
    });

    res.json({ accessGrants });
  } catch (error) {
    next(error);
  }
};

export const checkAccess = async (req, res, next) => {
  try {
    const { resourceType, resourceId, permission } = req.query;

    const accessGrant = await AccessGrant.findOne({
      where: {
        userId: req.user.id,
        resourceType,
        resourceId: resourceId || null,
      },
    });

    if (!accessGrant) {
      return res.json({ hasAccess: false });
    }

    if (accessGrant.expiresAt && new Date(accessGrant.expiresAt) < new Date()) {
      return res.json({ hasAccess: false, reason: 'Access expired' });
    }

    const hasPermission = accessGrant.permissions.includes(permission);

    res.json({ hasAccess: hasPermission });
  } catch (error) {
    next(error);
  }
};
