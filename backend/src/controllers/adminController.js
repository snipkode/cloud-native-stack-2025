import { User, Deployment, Transaction } from '../models/index.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, credits, status, role } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      name: name || user.name,
      credits: credits !== undefined ? credits : user.credits,
      status: status || user.status,
      role: role || user.role,
    });

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllDeployments = async (req, res, next) => {
  try {
    const deployments = await Deployment.findAll({
      include: [{ model: User, attributes: ['id', 'email', 'name'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ deployments });
  } catch (error) {
    next(error);
  }
};

export const getDeploymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'email', 'name'] }],
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json({ deployment });
  } catch (error) {
    next(error);
  }
};

export const updateDeployment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const deployment = await Deployment.findByPk(id);

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    await deployment.update({
      status: status || deployment.status,
    });

    const updatedDeployment = await Deployment.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'email', 'name'] }],
    });

    res.json({
      message: 'Deployment updated successfully',
      deployment: updatedDeployment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDeployment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findByPk(id);

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    await deployment.destroy();

    res.json({ message: 'Deployment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getSystemStats = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const totalDeployments = await Deployment.count();
    const activeDeployments = await Deployment.count({
      where: { status: ['deploying', 'deployed'] }
    });
    
    // Calculate total credits across all users
    const totalCreditsResult = await User.sum('credits');
    const totalCredits = totalCreditsResult || 0;

    res.json({
      stats: {
        totalUsers,
        totalDeployments,
        totalCredits,
        activeDeployments,
      }
    });
  } catch (error) {
    next(error);
  }
};