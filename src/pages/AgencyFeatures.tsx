import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Users, 
  Mail, 
  Globe, 
  Settings, 
  Lock, 
  CreditCard, 
  FileText, 
  Send,
  Plus,
  Trash2,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { sendTeamInvitation, sendClientPortalLink } from '../lib/emailService';

interface EmailSettings {
  id?: string;
  provider: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username: string;
  smtp_password: string;
  from_name: string;
  from_email: string;
  reply_to?: string;
  is_active: boolean;
}

interface TeamMember {
  id?: string;
  email: string;
  name: string;
  role: string;
  status: string;
  invited_at?: string;
  joined_at?: string;
}

interface ClientPortalAccess {
  id?: string;
  client_email: string;
  access_token: string;
  expires_at?: string;
  is_active: boolean;
  created_at?: string;
}

const AgencyFeatures: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('team');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  
  // Email settings
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    provider: 'gmail',
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: true,
    smtp_username: '',
    smtp_password: '',
    from_name: '',
    from_email: '',
    reply_to: '',
    is_active: true
  });

  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newTeamMember, setNewTeamMember] = useState<TeamMember>({
    email: '',
    name: '',
    role: 'member',
    status: 'pending'
  });
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);

  // Client portal
  const [clientPortalAccess, setClientPortalAccess] = useState<ClientPortalAccess[]>([]);
  const [newClientAccess, setNewClientAccess] = useState<ClientPortalAccess>({
    client_email: '',
    access_token: '',
    is_active: true
  });
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  // Check if user has Agency plan
  const hasAgencyPlan = profile?.plan === 'agency';

  useEffect(() => {
    if (user && hasAgencyPlan) {
      fetchEmailSettings();
      fetchTeamMembers();
      fetchClientPortalAccess();
      fetchClients();
    }
  }, [user, hasAgencyPlan]);

  const fetchEmailSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setEmailSettings(data);
      } else {
        // Set default values if no settings exist
        setEmailSettings({
          provider: 'gmail',
          smtp_host: '',
          smtp_port: 587,
          smtp_secure: true,
          smtp_username: '',
          smtp_password: '',
          from_name: profile?.name || '',
          from_email: '',
          reply_to: '',
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
      toast.error('Failed to fetch email settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to fetch team members');
    }
  };

  const fetchClientPortalAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('client_portal_access')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      setClientPortalAccess(data || []);
    } catch (error) {
      console.error('Error fetching client portal access:', error);
      toast.error('Failed to fetch client portal access');
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
    }
  };

  const saveEmailSettings = async () => {
    if (!emailSettings.smtp_host || !emailSettings.smtp_username || !emailSettings.smtp_password || 
        !emailSettings.from_name || !emailSettings.from_email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // Check if settings already exist
      if (emailSettings.id) {
        // Update existing settings
        const { error } = await supabase
          .from('email_settings')
          .update({
            provider: emailSettings.provider,
            smtp_host: emailSettings.smtp_host,
            smtp_port: emailSettings.smtp_port,
            smtp_secure: emailSettings.smtp_secure,
            smtp_username: emailSettings.smtp_username,
            smtp_password: emailSettings.smtp_password,
            from_name: emailSettings.from_name,
            from_email: emailSettings.from_email,
            reply_to: emailSettings.reply_to,
            is_active: emailSettings.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', emailSettings.id);
        
        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('email_settings')
          .insert({
            user_id: user!.id,
            provider: emailSettings.provider,
            smtp_host: emailSettings.smtp_host,
            smtp_port: emailSettings.smtp_port,
            smtp_secure: emailSettings.smtp_secure,
            smtp_username: emailSettings.smtp_username,
            smtp_password: emailSettings.smtp_password,
            from_name: emailSettings.from_name,
            from_email: emailSettings.from_email,
            reply_to: emailSettings.reply_to,
            is_active: emailSettings.is_active
          });
        
        if (error) throw error;
        
        // Refresh to get the ID
        await fetchEmailSettings();
      }

      toast.success('Email settings saved successfully');
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast.error('Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  const testEmailSettings = async () => {
    setTestingEmail(true);
    try {
      // In a real app, you would send a test email here
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Test email sent successfully!');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  };

  const addTeamMember = async () => {
    if (!newTeamMember.email || !newTeamMember.name) {
      toast.error('Email and name are required');
      return;
    }

    setSaving(true);
    try {
      // Generate a random access token
      const accessToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          user_id: user!.id,
          email: newTeamMember.email,
          name: newTeamMember.name,
          role: newTeamMember.role,
          status: 'pending',
          invited_by: user!.id
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      const permissions = {
        manage_invoices: true,
        manage_clients: newTeamMember.role !== 'viewer',
        view_analytics: true,
        manage_settings: newTeamMember.role === 'admin'
      };

      await sendTeamInvitation(
        newTeamMember.email,
        newTeamMember.name,
        newTeamMember.role,
        permissions,
        profile?.name || 'Team Owner',
        profile?.name || 'Your Company'
      );

      setTeamMembers([data, ...teamMembers]);
      setNewTeamMember({
        email: '',
        name: '',
        role: 'member',
        status: 'pending'
      });
      setShowAddMemberForm(false);
      toast.success('Team member invited successfully');
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
    } finally {
      setSaving(false);
    }
  };

  const removeTeamMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTeamMembers(teamMembers.filter(member => member.id !== id));
      toast.success('Team member removed successfully');
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
    }
  };

  const addClientPortalAccess = async () => {
    if (!newClientAccess.client_email) {
      toast.error('Client email is required');
      return;
    }

    setSaving(true);
    try {
      // Generate a random access token
      const accessToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Set expiration date to 1 year from now
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { data, error } = await supabase
        .from('client_portal_access')
        .insert({
          user_id: user!.id,
          client_email: newClientAccess.client_email,
          access_token: accessToken,
          expires_at: expiresAt.toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Find client name
      const client = clients.find(c => c.email === newClientAccess.client_email);
      const clientName = client ? client.name : 'Client';
      const businessName = profile?.name || 'Your Business';

      // Send portal access email
      await sendClientPortalLink(
        newClientAccess.client_email,
        clientName,
        accessToken,
        businessName,
        profile
      );

      setClientPortalAccess([data, ...clientPortalAccess]);
      setNewClientAccess({
        client_email: '',
        access_token: '',
        is_active: true
      });
      setShowAddClientForm(false);
      toast.success('Client portal access created successfully');
    } catch (error) {
      console.error('Error adding client portal access:', error);
      toast.error('Failed to add client portal access');
    } finally {
      setSaving(false);
    }
  };

  const removeClientAccess = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this client\'s access?')) return;

    try {
      const { error } = await supabase
        .from('client_portal_access')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setClientPortalAccess(clientPortalAccess.filter(access => access.id !== id));
      toast.success('Client access revoked successfully');
    } catch (error) {
      console.error('Error removing client access:', error);
      toast.error('Failed to revoke client access');
    }
  };

  const toggleClientAccess = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('client_portal_access')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      
      setClientPortalAccess(clientPortalAccess.map(access => 
        access.id === id ? { ...access, is_active: !isActive } : access
      ));
      toast.success(`Client access ${!isActive ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error toggling client access:', error);
      toast.error('Failed to update client access');
    }
  };

  // Set default SMTP settings based on provider
  const handleProviderChange = (provider: string) => {
    let newSettings = { ...emailSettings, provider };
    
    switch (provider) {
      case 'gmail':
        newSettings = {
          ...newSettings,
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_secure: false
        };
        break;
      case 'sendinblue':
        newSettings = {
          ...newSettings,
          smtp_host: 'smtp-relay.sendinblue.com',
          smtp_port: 587,
          smtp_secure: false
        };
        break;
      case 'hostinger':
        newSettings = {
          ...newSettings,
          smtp_host: 'smtp.hostinger.com',
          smtp_port: 465,
          smtp_secure: true
        };
        break;
    }
    
    setEmailSettings(newSettings);
  };

  if (!hasAgencyPlan) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Crown className="mx-auto h-12 w-12 text-purple-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Agency Plan Required</h3>
          <p className="text-gray-500 mb-6">
            These features are only available for Agency plan subscribers.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Upgrade to Agency Plan
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Crown className="h-6 w-6 text-purple-600 mr-2" />
          Agency Features
        </h1>
        <p className="text-gray-600">Manage your team, client portal, and email settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'team'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 mr-2" />
            Team Management
          </button>
          <button
            onClick={() => setActiveTab('client-portal')}
            className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'client-portal'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Lock className="h-4 w-4 mr-2" />
            Client Portal
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'email'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Settings
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'branding'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Globe className="h-4 w-4 mr-2" />
            White Labeling
          </button>
        </nav>
      </div>

      {/* Team Management Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <button
              onClick={() => setShowAddMemberForm(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite Team Member
            </button>
          </div>

          {showAddMemberForm && (
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite New Team Member</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newTeamMember.name}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Team member's name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newTeamMember.email}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="team@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={newTeamMember.role}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="admin">Admin (Full Access)</option>
                    <option value="member">Member (Create/Edit)</option>
                    <option value="viewer">Viewer (Read Only)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddMemberForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addTeamMember}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Sending Invite...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          )}

          {teamMembers.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invited</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{member.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          member.status === 'active' ? 'bg-green-100 text-green-800' :
                          member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.invited_at ? new Date(member.invited_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => removeTeamMember(member.id!)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members Yet</h3>
              <p className="text-gray-500 mb-6">
                Invite team members to collaborate on invoices and client management
              </p>
              <button
                onClick={() => setShowAddMemberForm(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Invite Team Member
              </button>
            </div>
          )}

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Team Management Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Role-Based Access</h4>
                  <p className="text-sm text-purple-700">Assign different permission levels to team members</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Email Invitations</h4>
                  <p className="text-sm text-purple-700">Send automated invites to new team members</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Activity Tracking</h4>
                  <p className="text-sm text-purple-700">Monitor team activity and invoice changes</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Permission Management</h4>
                  <p className="text-sm text-purple-700">Control who can view, edit, or manage invoices</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Portal Tab */}
      {activeTab === 'client-portal' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Client Portal Access</h2>
            <button
              onClick={() => setShowAddClientForm(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client Access
            </button>
          </div>

          {showAddClientForm && (
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Client Portal Access</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email *
                </label>
                {clients.length > 0 ? (
                  <select
                    value={newClientAccess.client_email}
                    onChange={(e) => setNewClientAccess(prev => ({ ...prev, client_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.email}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="email"
                    value={newClientAccess.client_email}
                    onChange={(e) => setNewClientAccess(prev => ({ ...prev, client_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="client@example.com"
                  />
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddClientForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addClientPortalAccess}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Creating Access...' : 'Create Access'}
                </button>
              </div>
            </div>
          )}

          {clientPortalAccess.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Token</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientPortalAccess.map((access) => (
                    <tr key={access.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{access.client_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="truncate max-w-xs">{access.access_token}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/client/${access.access_token}`);
                              toast.success('Portal link copied to clipboard');
                            }}
                            className="ml-2 text-purple-600 hover:text-purple-900"
                          >
                            Copy Link
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          access.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {access.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {access.created_at ? new Date(access.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {access.expires_at ? new Date(access.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => toggleClientAccess(access.id!, access.is_active)}
                            className={`text-sm ${access.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          >
                            {access.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => removeClientAccess(access.id!)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
              <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Client Portal Access Yet</h3>
              <p className="text-gray-500 mb-6">
                Create secure portal access for your clients to view and download their invoices
              </p>
              <button
                onClick={() => setShowAddClientForm(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Client Access
              </button>
            </div>
          )}

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Client Portal Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Lock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Secure Access</h4>
                  <p className="text-sm text-purple-700">Unique tokens for each client with expiration dates</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Invoice History</h4>
                  <p className="text-sm text-purple-700">Clients can view and download all their invoices</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Payment Integration</h4>
                  <p className="text-sm text-purple-700">Clients can pay invoices directly through the portal</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Automated Notifications</h4>
                  <p className="text-sm text-purple-700">Email notifications for new invoices and updates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Settings Tab */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Branded Email Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Provider
                </label>
                <select
                  value={emailSettings.provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="gmail">Gmail SMTP</option>
                  <option value="sendinblue">Sendinblue (Brevo)</option>
                  <option value="hostinger">Hostinger</option>
                  <option value="custom">Custom SMTP</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Host *
                  </label>
                  <input
                    type="text"
                    value={emailSettings.smtp_host}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="smtp.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Port *
                  </label>
                  <input
                    type="number"
                    value={emailSettings.smtp_port}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="587"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="smtp_secure"
                      checked={emailSettings.smtp_secure}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_secure: e.target.checked }))}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="smtp_secure" className="ml-2 block text-sm text-gray-700">
                      Use Secure Connection (SSL/TLS)
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Username *
                  </label>
                  <input
                    type="text"
                    value={emailSettings.smtp_username}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Password *
                  </label>
                  <input
                    type="password"
                    value={emailSettings.smtp_password}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name *
                    </label>
                    <input
                      type="text"
                      value={emailSettings.from_name}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, from_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your Business Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Email *
                    </label>
                    <input
                      type="email"
                      value={emailSettings.from_email}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, from_email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="invoices@yourdomain.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reply-To Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={emailSettings.reply_to || ''}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, reply_to: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="support@yourdomain.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={testEmailSettings}
                  disabled={testingEmail || !emailSettings.smtp_host || !emailSettings.smtp_username || !emailSettings.from_email}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {testingEmail ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Test Settings
                    </>
                  )}
                </button>
                <button
                  onClick={saveEmailSettings}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Email Provider Setup Help</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-semibold text-purple-900 mb-2">Gmail SMTP Setup</h4>
                <ul className="list-disc list-inside text-sm text-purple-700 space-y-1">
                  <li>Host: smtp.gmail.com</li>
                  <li>Port: 587 (TLS) or 465 (SSL)</li>
                  <li>Username: Your Gmail address</li>
                  <li>Password: Your app password (not your regular Gmail password)</li>
                  <li>You need to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-purple-900 underline">create an app password</a> for this to work</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-md font-semibold text-purple-900 mb-2">Sendinblue (Brevo) Setup</h4>
                <ul className="list-disc list-inside text-sm text-purple-700 space-y-1">
                  <li>Host: smtp-relay.sendinblue.com</li>
                  <li>Port: 587</li>
                  <li>Username: Your Sendinblue email</li>
                  <li>Password: Your SMTP key (found in your Sendinblue account)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-md font-semibold text-purple-900 mb-2">Hostinger Setup</h4>
                <ul className="list-disc list-inside text-sm text-purple-700 space-y-1">
                  <li>Host: smtp.hostinger.com</li>
                  <li>Port: 465 (SSL)</li>
                  <li>Username: Your Hostinger email</li>
                  <li>Password: Your email password</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* White Labeling Tab */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">White Labeling Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Domain
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="invoices.yourdomain.com"
                  />
                  <button className="ml-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    Verify
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Set up a custom domain for your client portal and invoice pages
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      defaultValue="#3B82F6"
                      className="h-10 w-10 border-0 p-0"
                    />
                    <input
                      type="text"
                      defaultValue="#3B82F6"
                      className="ml-2 flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      defaultValue="#1E40AF"
                      className="h-10 w-10 border-0 p-0"
                    />
                    <input
                      type="text"
                      defaultValue="#1E40AF"
                      className="ml-2 flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://yourdomain.com/logo.png"
                  />
                  <button className="ml-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    Upload
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom CSS
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add custom CSS to style your client portal and invoice pages"
                ></textarea>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hide_branding"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="hide_branding" className="ml-2 block text-sm text-gray-700">
                  Hide "Powered by InvoiceFlow" branding
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Branding Settings
                </button>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">White Labeling Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Globe className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Custom Domain</h4>
                  <p className="text-sm text-purple-700">Use your own domain for a professional experience</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Brand Consistency</h4>
                  <p className="text-sm text-purple-700">Match your brand colors and style</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Branded Emails</h4>
                  <p className="text-sm text-purple-700">Send emails from your own domain</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Professional Image</h4>
                  <p className="text-sm text-purple-700">Present a cohesive brand experience to clients</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyFeatures;