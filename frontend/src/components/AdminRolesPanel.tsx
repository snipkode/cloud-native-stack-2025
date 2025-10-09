import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Edit3, Users, Key, User as UserIcon } from 'lucide-react';
import { User } from '../types/api';
import { rbacService, Role, Permission } from '../services/rbacService';
import { useNotification } from '../contexts/NotificationContext';

interface AdminRolesPanelProps {
  users: User[];
  onUpdate: () => void;
}

export function AdminRolesPanel({ users, onUpdate }: AdminRolesPanelProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });
  const [permissionForm, setPermissionForm] = useState({ name: '', description: '', resourceType: '', action: '' });
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isCreatingPermission, setIsCreatingPermission] = useState(false);
  const [userRoles, setUserRoles] = useState<{ [key: string]: string[] }>({});
  const [userPermissions, setUserPermissions] = useState<{ [key: string]: string[] }>({});
  const { showNotification } = useNotification();

  useEffect(() => {
    loadRolesAndPermissions();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      loadUserRolesAndPermissions();
    }
  }, [users]);

  const loadRolesAndPermissions = async () => {
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        rbacService.getRoles(),
        rbacService.getPermissions(),
      ]);
      setRoles(rolesRes.roles);
      setPermissions(permissionsRes.permissions);
    } catch (error) {
      console.error('Failed to load roles and permissions:', error);
      showNotification('Failed to load roles and permissions', 'error');
    }
  };

  const loadUserRolesAndPermissions = async () => {
    try {
      // For simplicity, we'll fetch role assignments for each user
      // In a real app, you might want to create a bulk endpoint
      const rolesMap: { [key: string]: string[] } = {};
      const permissionsMap: { [key: string]: string[] } = {};

      for (const user of users) {
        try {
          const userPermissionsRes = await rbacService.getUserPermissions(user.id);
          permissionsMap[user.id] = userPermissionsRes.permissions.map(p => p.id); // Using p.id instead of p.name
        } catch (error) {
          console.error(`Failed to load permissions for user ${user.id}:`, error);
          // Initialize with empty array if failed
          permissionsMap[user.id] = [];
        }
      }

      setUserRoles(rolesMap);
      setUserPermissions(permissionsMap);
    } catch (error) {
      console.error('Failed to load user roles and permissions:', error);
      showNotification('Failed to load user roles and permissions', 'error');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rbacService.createRole(roleForm);
      setRoleForm({ name: '', description: '' });
      setIsCreatingRole(false);
      await loadRolesAndPermissions();
      showNotification('Role created successfully', 'success');
    } catch (error) {
      console.error('Failed to create role:', error);
      showNotification('Failed to create role', 'error');
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rbacService.createPermission(permissionForm);
      setPermissionForm({ name: '', description: '', resourceType: '', action: '' });
      setIsCreatingPermission(false);
      await loadRolesAndPermissions();
      showNotification('Permission created successfully', 'success');
    } catch (error) {
      console.error('Failed to create permission:', error);
      showNotification('Failed to create permission', 'error');
    }
  };

  const handleUpdateRole = async (roleId: string, updatedData: Partial<Role>) => {
    try {
      await rbacService.updateRole(roleId, updatedData);
      await loadRolesAndPermissions();
      showNotification('Role updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update role:', error);
      showNotification('Failed to update role', 'error');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) return;

    try {
      await rbacService.deleteRole(roleId);
      await loadRolesAndPermissions();
      showNotification('Role deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete role:', error);
      showNotification('Failed to delete role', 'error');
    }
  };



  const handleUpdatePermission = async (permissionId: string, updatedData: Partial<Permission>) => {
    try {
      await rbacService.updatePermission(permissionId, updatedData);
      await loadRolesAndPermissions();
      showNotification('Permission updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update permission:', error);
      showNotification('Failed to update permission', 'error');
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm('Are you sure you want to delete this permission? This action cannot be undone.')) return;

    try {
      await rbacService.deletePermission(permissionId);
      await loadRolesAndPermissions();
      showNotification('Permission deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete permission:', error);
      showNotification('Failed to delete permission', 'error');
    }
  };

  const handleAssignRoleToUser = async (userId: string, roleId: string) => {
    try {
      await rbacService.assignRoleToUser(userId, roleId);
      showNotification('Role assigned to user successfully', 'success');
      onUpdate(); // This will refresh the main admin data
    } catch (error) {
      console.error('Failed to assign role to user:', error);
      showNotification('Failed to assign role to user', 'error');
    }
  };

  const handleRemoveRoleFromUser = async (userId: string, roleId: string) => {
    try {
      await rbacService.removeRoleFromUser(userId, roleId);
      showNotification('Role removed from user successfully', 'success');
      onUpdate(); // This will refresh the main admin data
    } catch (error) {
      console.error('Failed to remove role from user:', error);
      showNotification('Failed to remove role from user', 'error');
    }
  };

  const handleAssignPermissionToUser = async (userId: string, permissionId: string) => {
    try {
      await rbacService.assignPermissionToUser(userId, permissionId);
      showNotification('Permission assigned to user successfully', 'success');
      onUpdate(); // This will refresh the main admin data
    } catch (error) {
      console.error('Failed to assign permission to user:', error);
      showNotification('Failed to assign permission to user', 'error');
    }
  };

  const handleRemovePermissionFromUser = async (userId: string, permissionId: string) => {
    try {
      await rbacService.removePermissionFromUser(userId, permissionId);
      showNotification('Permission removed from user successfully', 'success');
      onUpdate(); // This will refresh the main admin data
    } catch (error) {
      console.error('Failed to remove permission from user:', error);
      showNotification('Failed to remove permission from user', 'error');
    }
  };

  const handleAssignPermissionToRole = async (roleId: string, permissionId: string) => {
    try {
      await rbacService.assignPermissionToRole(roleId, permissionId);
      showNotification('Permission assigned to role successfully', 'success');
    } catch (error) {
      console.error('Failed to assign permission to role:', error);
      showNotification('Failed to assign permission to role', 'error');
    }
  };

  const handleRemovePermissionFromRole = async (roleId: string, permissionId: string) => {
    try {
      await rbacService.removePermissionFromRole(roleId, permissionId);
      showNotification('Permission removed from role successfully', 'success');
    } catch (error) {
      console.error('Failed to remove permission from role:', error);
      showNotification('Failed to remove permission from role', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Roles Management */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Role Management
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage roles and their permissions</p>
          </div>
          <button
            onClick={() => setIsCreatingRole(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Role</span>
          </button>
        </div>

        {isCreatingRole && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <h3 className="font-medium text-slate-900 dark:text-white mb-3">Create New Role</h3>
            <form onSubmit={handleCreateRole} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role Name</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Enter role description"
                  rows={2}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Role
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingRole(false);
                    setRoleForm({ name: '', description: '' });
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">{role.name}</h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setSelectedRole(role)}
                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded"
                    title="Edit role"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded"
                    title="Delete role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{role.description}</p>
              
              {selectedRole?.id === role.id && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role Name</label>
                    <input
                      type="text"
                      value={selectedRole.name}
                      onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                      value={selectedRole.description}
                      onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-600 dark:text-white"
                      rows={2}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        handleUpdateRole(role.id, { name: selectedRole.name, description: selectedRole.description });
                        setSelectedRole(null);
                      }}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setSelectedRole(null)}
                      className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role Permissions</h4>
                <div className="space-y-2">
                  {permissions.map(permission => {
                    const hasPermission = false; // In a real app, you would check if the role has this permission
                    return (
                      <div key={permission.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{permission.name}</span>
                        <button
                          onClick={() => 
                            hasPermission 
                              ? handleRemovePermissionFromRole(role.id, permission.id)
                              : handleAssignPermissionToRole(role.id, permission.id)
                          }
                          className={`px-2 py-1 rounded text-xs ${
                            hasPermission
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50'
                          }`}
                        >
                          {hasPermission ? 'Remove' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users Role Assignment */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-600" />
              User Role Assignment
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Assign roles and permissions to users</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">User</th>
                <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">Roles</th>
                <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">Permissions</th>
                <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      <span className="font-medium text-slate-900 dark:text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{user.email}</td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {userRoles[user.id] ? (
                        userRoles[user.id].map((role, idx) => (
                          <span key={idx} className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded mr-1">
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs">No roles assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {userPermissions[user.id] ? (
                        userPermissions[user.id].map((permission, idx) => (
                          <span key={idx} className="inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded mr-1">
                            {permission}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs">No direct permissions</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Assign roles/permissions"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedUser && (
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <h3 className="font-medium text-slate-900 dark:text-white mb-3">Assign Role to {selectedUser.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assign Role</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {roles.map(role => {
                    const hasRole = userRoles[selectedUser.id]?.includes(role.name) || false;
                    return (
                      <div key={role.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-600 rounded">
                        <span className="text-sm">{role.name}</span>
                        <button
                          onClick={() => 
                            hasRole 
                              ? handleRemoveRoleFromUser(selectedUser.id, role.id)
                              : handleAssignRoleToUser(selectedUser.id, role.id)
                          }
                          className={`px-3 py-1 rounded text-xs ${
                            hasRole
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50'
                          }`}
                        >
                          {hasRole ? 'Remove' : 'Assign'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assign Direct Permission</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {permissions.map(permission => {
                    const hasPermission = userPermissions[selectedUser.id]?.includes(permission.name) || false;
                    return (
                      <div key={permission.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-600 rounded">
                        <span className="text-sm">{permission.name}</span>
                        <button
                          onClick={() => 
                            hasPermission 
                              ? handleRemovePermissionFromUser(selectedUser.id, permission.id)
                              : handleAssignPermissionToUser(selectedUser.id, permission.id)
                          }
                          className={`px-3 py-1 rounded text-xs ${
                            hasPermission
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50'
                          }`}
                        >
                          {hasPermission ? 'Remove' : 'Assign'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Permissions Management */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
              <Key className="w-5 h-5 mr-2 text-purple-600" />
              Permission Management
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage system permissions</p>
          </div>
          <button
            onClick={() => setIsCreatingPermission(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Permission</span>
          </button>
        </div>

        {isCreatingPermission && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <h3 className="font-medium text-slate-900 dark:text-white mb-3">Create New Permission</h3>
            <form onSubmit={handleCreatePermission} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Permission Name</label>
                <input
                  type="text"
                  value={permissionForm.name}
                  onChange={(e) => setPermissionForm({ ...permissionForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Enter permission name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={permissionForm.description}
                  onChange={(e) => setPermissionForm({ ...permissionForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Enter permission description"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resource Type</label>
                <input
                  type="text"
                  value={permissionForm.resourceType}
                  onChange={(e) => setPermissionForm({ ...permissionForm, resourceType: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Enter resource type (e.g., user, deployment, billing)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Action</label>
                <input
                  type="text"
                  value={permissionForm.action}
                  onChange={(e) => setPermissionForm({ ...permissionForm, action: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Enter action (e.g., read, write, delete)"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Permission
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingPermission(false);
                    setPermissionForm({ name: '', description: '', resourceType: '', action: '' });
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {permissions.map((permission) => (
            <div key={permission.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">{permission.name}</h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setSelectedPermission(permission)}
                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded"
                    title="Edit permission"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePermission(permission.id)}
                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded"
                    title="Delete permission"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {selectedPermission?.id === permission.id && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Permission Name</label>
                    <input
                      type="text"
                      value={selectedPermission.name}
                      onChange={(e) => setSelectedPermission({ ...selectedPermission, name: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                      value={selectedPermission.description}
                      onChange={(e) => setSelectedPermission({ ...selectedPermission, description: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-600 dark:text-white"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resource Type</label>
                    <input
                      type="text"
                      value={selectedPermission.resourceType}
                      onChange={(e) => setSelectedPermission({ ...selectedPermission, resourceType: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Action</label>
                    <input
                      type="text"
                      value={selectedPermission.action}
                      onChange={(e) => setSelectedPermission({ ...selectedPermission, action: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-600 dark:text-white"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        handleUpdatePermission(permission.id, { 
                          name: selectedPermission.name, 
                          description: selectedPermission.description,
                          resourceType: selectedPermission.resourceType,
                          action: selectedPermission.action
                        });
                        setSelectedPermission(null);
                      }}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setSelectedPermission(null)}
                      className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{permission.description}</p>
              
              <div className="mt-2">
                <span className="inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded">
                  Created: {new Date(permission.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}