import React, { useState, useEffect } from 'react';
import { getAllFromLocal, saveToLocal, addToSyncQueue } from '@/src/lib/offline.ts';
import { User, UserRole } from '@/src/types';
import { Settings, UserPlus, Users, Building, ShieldCheck, Mail, Trash2, Key } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    role: UserRole.NURSE,
  });

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getAllFromLocal('users');
        setUsers(data as User[]);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const user: User = {
      id: crypto.randomUUID(),
      facilityId: (import.meta as any).env.VITE_FACILITY_ID || 'facility-1',
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as UserRole,
    };

    try {
      await saveToLocal('users', user);
      await addToSyncQueue({ tableName: 'users', operation: 'INSERT', payload: user });
      setUsers([...users, user]);
      setShowAddUser(false);
      setNewUser({ role: UserRole.NURSE });
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Settings className="text-m-teal" />
            Control Centre
          </h2>
          <p className="text-sm text-slate-500 font-medium">Facility & User Management</p>
        </div>
        
        <button 
          onClick={() => setShowAddUser(!showAddUser)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} />
          {showAddUser ? 'Cancel' : 'Provision Staff'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Settings */}
        <div className="space-y-6">
          <div className="bento-card bg-m-teal text-white border-none shadow-m-teal/20">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-70">Active Facility</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Building size={24} />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">Mbagathi District Hospital</p>
                <p className="text-xs opacity-70">Level 4 Public Hospital • Nairobi</p>
              </div>
            </div>
          </div>

          <div className="bento-card">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Security Parameters</h3>
            <div className="space-y-4">
              <SecurityToggle label="PIN Rotation (30 days)" enabled={true} />
              <SecurityToggle label="Auto-Lock (5 mins)" enabled={true} />
              <SecurityToggle label="Offline Expiry (72 hrs)" enabled={true} />
            </div>
            <button className="w-full mt-6 flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors">
              <Key size={14} />
              Rotate Administrator PIN
            </button>
          </div>
        </div>

        {/* Right Column: User Management */}
        <div className="lg:col-span-2 space-y-6">
          {showAddUser && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bento-card border-m-teal border-dashed"
            >
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4">New Staff Provisioning</h3>
              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Dr. Jane Doe"
                    value={newUser.name || ''}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="input-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="jane@facility.com"
                    value={newUser.email || ''}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="input-label">Clinical Role</label>
                  <select 
                    className="form-input"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                  >
                    {Object.values(UserRole).map(role => (
                      <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="btn-primary w-full h-12">Confirm Provisioning</button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="bento-card p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Users size={16} className="text-m-teal" />
                Staff Directory
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{users.length} Active Accounts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading directory...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No staff accounts provisioned.</td></tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id} className="text-xs text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-m-teal/5 text-m-teal rounded-full flex items-center justify-center font-bold">
                              {user.name?.charAt(0) || '?'}
                            </div>
                            <span className="font-bold text-slate-800">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className={user.role.includes('admin') ? 'text-m-amber' : 'text-slate-400'} />
                            <span className="capitalize">{user.role.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-400 hover:text-m-teal transition-colors">
                            <Mail size={14} />
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button className="p-2 text-slate-400 hover:text-m-red hover:bg-m-red/10 rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityToggle({ label, enabled }: { label: string, enabled: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <div className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? 'bg-m-teal' : 'bg-slate-300'}`}>
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enabled ? 'left-6' : 'left-1'}`} />
      </div>
    </div>
  );
}
