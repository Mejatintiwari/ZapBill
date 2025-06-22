"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  Mail,
  CreditCard,
  Shield,
  RefreshCw,
  Download,
  Search,
  Ban,
  CheckCircle,
} from "lucide-react"
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
interface AdminStats {
  totalUsers: number
  totalInvoices: number
  totalRevenue: number
  activeUsers: number
  supportTickets: number
  feedbackSubmissions: number
}

interface User {
  id: string
  email: string
  name: string
  plan: string
  created_at: string
  is_banned: boolean
  plan_expires_at?: string
}

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  total: number
  status: string
  created_at: string
  currency: string
  user_id: string
  users?: { name: string; email: string }
}

interface SupportTicket {
  id: string
  name: string
  email: string
  subject: string
  category: string
  priority: string
  status: string
  message: string
  created_at: string
}

interface FeedbackSubmission {
  id: string
  name: string
  email: string
  type: string
  rating: number
  message: string
  status: string
  created_at: string
}

const AdminPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    activeUsers: 0,
    supportTickets: 0,
    feedbackSubmissions: 0,
  })

  const [users, setUsers] = useState<User[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([])
  const [feedbackSubmissions, setFeedbackSubmissions] = useState<FeedbackSubmission[]>([])

  // Search and filter states
  const [userSearch, setUserSearch] = useState("")
  const [invoiceSearch, setInvoiceSearch] = useState("")
  const [ticketSearch, setTicketSearch] = useState("")
  const [feedbackSearch, setFeedbackSearch] = useState("")

  // Check if user is admin
  const isAdmin = user?.email === "admin@invoiceapp.com"

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchAllData()
    } else if (!authLoading && !isAdmin) {
      setLoading(false) // Stop loading if not admin
    }
  }, [isAdmin, authLoading])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      console.log("Starting to fetch all admin data...")

      // Fetch users with proper error handling
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (usersError) {
        console.error("Error fetching users:", usersError)
        toast.error("Failed to fetch users data")
      } else {
        console.log("Users fetched:", usersData?.length || 0)
        setUsers(usersData || [])
      }

      // Fetch invoices with user information
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(`
          *,
          users!inner(name, email)
        `)
        .order("created_at", { ascending: false })

      if (invoicesError) {
        console.error("Error fetching invoices:", invoicesError)
        toast.error("Failed to fetch invoices data")
      } else {
        console.log("Invoices fetched:", invoicesData?.length || 0)
        setInvoices(invoicesData || [])
      }

      // Fetch support tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })

      if (ticketsError) {
        console.error("Error fetching support tickets:", ticketsError)
        toast.error("Failed to fetch support tickets")
      } else {
        console.log("Support tickets fetched:", ticketsData?.length || 0)
        setSupportTickets(ticketsData || [])
      }

      // Fetch feedback submissions
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback_submissions")
        .select("*")
        .order("created_at", { ascending: false })

      if (feedbackError) {
        console.error("Error fetching feedback:", feedbackError)
        toast.error("Failed to fetch feedback data")
      } else {
        console.log("Feedback submissions fetched:", feedbackData?.length || 0)
        setFeedbackSubmissions(feedbackData || [])
      }

      // Calculate stats
      const totalUsers = usersData?.length || 0
      const totalInvoices = invoicesData?.length || 0
      const totalRevenue =
        invoicesData?.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + (inv.total || 0), 0) || 0
      const activeUsers =
        usersData?.filter((user) => new Date(user.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          .length || 0

      setStats({
        totalUsers,
        totalInvoices,
        totalRevenue,
        activeUsers,
        supportTickets: ticketsData?.length || 0,
        feedbackSubmissions: feedbackData?.length || 0,
      })

      console.log("All data fetched successfully:", {
        users: totalUsers,
        invoices: totalInvoices,
        tickets: ticketsData?.length || 0,
        feedback: feedbackData?.length || 0,
      })
    } catch (error) {
      console.error("Error fetching admin data:", error)
      toast.error("Failed to fetch admin data")
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchAllData()
    setRefreshing(false)
    toast.success("Data refreshed successfully")
  }

  const toggleUserBan = async (userId: string, currentBanStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          is_banned: !currentBanStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) throw error

      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, is_banned: !currentBanStatus } : user)))

      toast.success(`User ${!currentBanStatus ? "banned" : "unbanned"} successfully`)
    } catch (error) {
      console.error("Error updating user ban status:", error)
      toast.error("Failed to update user status")
    }
  }

  const updateUserPlan = async (userId: string, newPlan: string) => {
    try {
      const expirationDate =
        newPlan !== "free"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          : null

      const { error } = await supabase
        .from("users")
        .update({
          plan: newPlan,
          plan_expires_at: expirationDate?.toISOString() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) throw error

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, plan: newPlan, plan_expires_at: expirationDate?.toISOString() || undefined }
            : user,
        ),
      )

      toast.success(`User plan updated to ${newPlan} successfully`)
    } catch (error) {
      console.error("Error updating user plan:", error)
      toast.error("Failed to update user plan")
    }
  }

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId)

      if (error) throw error

      setSupportTickets((prev) =>
        prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket)),
      )

      toast.success("Ticket status updated successfully")
    } catch (error) {
      console.error("Error updating ticket status:", error)
      toast.error("Failed to update ticket status")
    }
  }

  const updateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("feedback_submissions")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", feedbackId)

      if (error) throw error

      setFeedbackSubmissions((prev) =>
        prev.map((feedback) => (feedback.id === feedbackId ? { ...feedback, status: newStatus } : feedback)),
      )

      toast.success("Feedback status updated successfully")
    } catch (error) {
      console.error("Error updating feedback status:", error)
      toast.error("Failed to update feedback status")
    }
  }

  const exportData = (data: any[], filename: string) => {
    try {
      if (!data || data.length === 0) {
        toast.error("No data to export")
        return
      }

      const csv = [
        Object.keys(data[0]).join(","),
        ...data.map((row) =>
          Object.values(row)
            .map((val) => `"${val}"`)
            .join(","),
        ),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Data exported successfully")
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("Failed to export data")
    }
  }

  // Filter functions
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearch.toLowerCase()),
  )

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      invoice.client_name?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      invoice.users?.name?.toLowerCase().includes(invoiceSearch.toLowerCase()),
  )

  const filteredTickets = supportTickets.filter(
    (ticket) =>
      ticket.subject?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      ticket.name?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      ticket.email?.toLowerCase().includes(ticketSearch.toLowerCase()),
  )

  const filteredFeedback = feedbackSubmissions.filter(
    (feedback) =>
      feedback.name?.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      feedback.email?.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      feedback.message?.toLowerCase().includes(feedbackSearch.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "resolved":
      case "implemented":
        return "bg-green-100 text-green-800"
      case "sent":
      case "in_progress":
      case "reviewed":
        return "bg-blue-100 text-blue-800"
      case "overdue":
      case "urgent":
      case "high":
        return "bg-red-100 text-red-800"
      case "draft":
      case "open":
      case "new":
        return "bg-yellow-100 text-yellow-800"
      case "closed":
      case "rejected":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: "overview", name: "Overview", icon: TrendingUp },
    { id: "users", name: "Users", icon: Users, count: stats.totalUsers },
    { id: "invoices", name: "Invoices", icon: FileText, count: stats.totalInvoices },
    { id: "support", name: "Support", icon: MessageSquare, count: stats.supportTickets },
    { id: "feedback", name: "Feedback", icon: Mail, count: stats.feedbackSubmissions },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage users, invoices, and system settings</p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg text-green-600">
              <FileText className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg text-yellow-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg text-red-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Support Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.supportTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
              <Mail className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{stats.feedbackSubmissions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8 overflow-x-auto">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{tab.count}</span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
            <div className="space-y-4">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        user.plan === "agency"
                          ? "bg-purple-100 text-purple-800"
                          : user.plan === "pro"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.plan}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h3>
            <div className="space-y-4">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{invoice.invoice_number}</p>
                    <p className="text-xs text-gray-500">{invoice.users?.name || "Unknown User"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{invoice.total?.toLocaleString() || 0}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">User Management ({filteredUsers.length})</h2>
            <button
              onClick={() => exportData(users, "users")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            user.plan === "agency"
                              ? "bg-purple-100 text-purple-800"
                              : user.plan === "pro"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(user.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_banned ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.is_banned ? "Banned" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <select
                            value={user.plan}
                            onChange={(e) => updateUserPlan(user.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="agency">Agency</option>
                          </select>
                          <button
                            onClick={() => toggleUserBan(user.id, user.is_banned)}
                            className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                              user.is_banned
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`}
                          >
                            {user.is_banned ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Ban className="h-3 w-3 mr-1" />
                            )}
                            {user.is_banned ? "Unban" : "Ban"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Invoice Management ({filteredInvoices.length})</h2>
            <button
              onClick={() => exportData(invoices, "invoices")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Invoices
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoice_number || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{invoice.users?.name || "Unknown"}</div>
                          <div className="text-sm text-gray-500">{invoice.users?.email || "No email"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.client_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.currency || "₹"}
                        {invoice.total?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(invoice.status || "draft")}`}
                        >
                          {invoice.status || "draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.created_at ? format(new Date(invoice.created_at), "MMM d, yyyy") : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "support" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Support Tickets ({filteredTickets.length})</h2>
            <button
              onClick={() => exportData(supportTickets, "support-tickets")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Tickets
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ticket.subject}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ticket.name}</div>
                          <div className="text-sm text-gray-500">{ticket.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {ticket.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(ticket.priority)}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={ticket.status}
                          onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(ticket.created_at), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "feedback" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Feedback Submissions ({filteredFeedback.length})</h2>
            <button
              onClick={() => exportData(feedbackSubmissions, "feedback")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Feedback
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFeedback.map((feedback) => (
                    <tr key={feedback.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{feedback.name}</div>
                          <div className="text-sm text-gray-500">{feedback.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{feedback.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${i < feedback.rating ? "text-yellow-400" : "text-gray-300"}`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="ml-2 text-sm text-gray-600">({feedback.rating})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate">{feedback.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={feedback.status}
                          onChange={(e) => updateFeedbackStatus(feedback.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="new">New</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="implemented">Implemented</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(feedback.created_at), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage
