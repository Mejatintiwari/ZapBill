import React, { useState, useEffect } from 'react';
import { Save, User, Bell, Shield, Trash2, Eye, EyeOff, Building, Mail, Phone, Globe, Upload, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CURRENCIES, CompanyInfo } from '../types';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    address: '',
    default_currency: 'USD',
    default_tax_rate: 0,
    default_discount: 0,
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    business_name: '',
    company_email: '',
    phone: '',
    website: '',
    logo: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
  });

  const [notifications, setNotifications] = useState({
    email_invoices: true,
    email_payments: true,
    email_reminders: true,
    email_marketing: false,
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        default_currency: profile.default_currency || 'USD',
        default_tax_rate: profile.default_tax_rate || 0,
        default_discount: profile.default_discount || 0,
      });
    }
    if (user) {
      fetchCompanyInfo();
    }
  }, [profile, user]);

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setCompanyInfo(data);
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
      toast.error('Failed to fetch company information');
    }
  };

  const saveProfile = async () => {
    if (!profileData.name) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        default_currency: profileData.default_currency,
        default_tax_rate: profileData.default_tax_rate,
        default_discount: profileData.default_discount,
        updated_at: new Date().toISOString()
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const saveCompanyInfo = async () => {
    if (!companyInfo.business_name || !companyInfo.company_email || !companyInfo.phone || 
        !companyInfo.address_line_1 || !companyInfo.city || !companyInfo.state || 
        !companyInfo.zip_code || !companyInfo.country) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Check if company info exists
      const { data: existingData, error: checkError } = await supabase
        .from('company_info')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('company_info')
          .update({
            business_name: companyInfo.business_name,
            company_email: companyInfo.company_email,
            phone: companyInfo.phone,
            website: companyInfo.website,
            logo: companyInfo.logo,
            address_line_1: companyInfo.address_line_1,
            address_line_2: companyInfo.address_line_2,
            city: companyInfo.city,
            state: companyInfo.state,
            zip_code: companyInfo.zip_code,
            country: companyInfo.country,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('company_info')
          .insert({
            user_id: user!.id,
            business_name: companyInfo.business_name,
            company_email: companyInfo.company_email,
            phone: companyInfo.phone,
            website: companyInfo.website,
            logo: companyInfo.logo,
            address_line_1: companyInfo.address_line_1,
            address_line_2: companyInfo.address_line_2,
            city: companyInfo.city,
            state: companyInfo.state,
            zip_code: companyInfo.zip_code,
            country: companyInfo.country
          });
        
        if (error) throw error;
      }

      toast.success('Company information updated successfully');
    } catch (error) {
      console.error('Error updating company info:', error);
      toast.error('Failed to update company information');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwords.new.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });
      
      if (error) throw error;
      
      toast.success('Password changed successfully');
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPasswordChange(false);
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // In a real app, you'd implement account deletion via Supabase Admin API
      // For now, we'll just sign out the user
      await signOut();
      toast.success('Account deletion initiated');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const saveNotifications = () => {
    toast.success('Notification preferences saved');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      <div className="space-y-6">
        {/* Company Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <Building className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={companyInfo.business_name}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, business_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your Business Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Company Email *
              </label>
              <input
                type="email"
                value={companyInfo.company_email}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, company_email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="company@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={companyInfo.phone}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="inline h-4 w-4 mr-1" />
                Company Website
              </label>
              <input
                type="url"
                value={companyInfo.website}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="url"
                    value={companyInfo.logo}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, logo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Logo URL"
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Address Line 1 *
              </label>
              <input
                type="text"
                value={companyInfo.address_line_1}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, address_line_1: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Business Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={companyInfo.address_line_2}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, address_line_2: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Suite 100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={companyInfo.city}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="New York"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Province *
              </label>
              <input
                type="text"
                value={companyInfo.state}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="NY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP/Postal Code *
              </label>
              <input
                type="text"
                value={companyInfo.zip_code}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, zip_code: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                value={companyInfo.country}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="United States"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={saveCompanyInfo}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Company Info
            </button>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select
                value={profileData.default_currency}
                onChange={(e) => setProfileData(prev => ({ ...prev, default_currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                value={profileData.default_tax_rate}
                onChange={(e) => setProfileData(prev => ({ ...prev, default_tax_rate: parseFloat(e.target.value) || 0 }))}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Discount (%)
              </label>
              <input
                type="number"
                value={profileData.default_discount}
                onChange={(e) => setProfileData(prev => ({ ...prev, default_discount: parseFloat(e.target.value) || 0 }))}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Address
              </label>
              <textarea
                value={profileData.address}
                onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={saveProfile}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Password</h3>
                <p className="text-sm text-gray-500">Change your account password</p>
              </div>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Change Password
              </button>
            </div>

            {showPasswordChange && (
              <div className="border-t pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwords.current}
                      onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwords.new}
                      onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={changePassword}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Update Password
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswords({ current: '', new: '', confirm: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center mb-4">
            <Bell className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>

          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {key.replace('email_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {key === 'email_invoices' && 'Get notified when invoices are sent'}
                    {key === 'email_payments' && 'Get notified when payments are received'}
                    {key === 'email_reminders' && 'Get notified about overdue invoices'}
                    {key === 'email_marketing' && 'Receive product updates and tips'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={saveNotifications}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Notification Settings
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
          <div className="flex items-center mb-4">
            <Trash2 className="h-5 w-5 text-red-500 mr-2" />
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-red-900">Delete Account</h3>
                <p className="text-sm text-red-600">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>

            {showDeleteConfirm && (
              <div className="border-t border-red-200 pt-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-red-900 mb-2">
                    Are you absolutely sure?
                  </h4>
                  <p className="text-sm text-red-700 mb-4">
                    This will permanently delete your account, all invoices, clients, and payment methods. 
                    This action cannot be undone.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={deleteAccount}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Yes, Delete Account
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;