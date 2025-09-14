'use client'

import { useEffect, useState } from 'react'
import { clientAPI } from '@/config/axios.config'
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button,
  Chip,
  Avatar,
  Spinner,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  useDisclosure,
  Pagination,
  Select,
  SelectItem
} from '@nextui-org/react'
import { toast } from 'react-toastify'
import { MdiBin, PhStudentFill, FluentSettings16Filled, FeEdit, SolarRefreshLineDuotone, FaGroup, MdiSearch } from '@/components/icons/icons'

interface User {
  _id: string
  username: string
  email: string
  role: 'admin' | 'instructor' | 'student'
  status: {
    is_banned: boolean
    ban_until?: string
    ban_reason?: string
  }
  info: {
    first_name: string
    last_name: string
  }
  created_at?: string
  updated_at?: string
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banUntil, setBanUntil] = useState('')
  const [banReason, setBanReason] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'student' as 'admin' | 'instructor' | 'student',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const { isOpen: isBanModalOpen, onOpen: onBanModalOpen, onClose: onBanModalClose } = useDisclosure()
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, roleFilter, statusFilter])

  const filterUsers = () => {
    let filtered = users

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.info?.first_name?.toLowerCase().includes(query)) ||
        (user.info?.last_name?.toLowerCase().includes(query)) ||
        `${user.info?.first_name} ${user.info?.last_name}`.toLowerCase().includes(query)
      )
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => !user.status?.is_banned)
      } else if (statusFilter === 'banned') {
        filtered = filtered.filter(user => user.status?.is_banned)
      }
    }

    setFilteredUsers(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await clientAPI.get('/user')
      const userData = response.data.data || []
      setUsers(userData)
      setFilteredUsers(userData)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      await clientAPI.delete(`/user/${userId}`)
      toast.success('User deleted successfully')
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const handleSuspendUser = (user: User) => {
    setSelectedUser(user)
    setBanUntil('')
    setBanReason('')
    onBanModalOpen()
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditForm({
      username: user.username,
      email: user.email,
      first_name: user.info?.first_name || '',
      last_name: user.info?.last_name || '',
      role: user.role,
      password: '',
      confirmPassword: ''
    })
    setShowPassword(false)
    onEditModalOpen()
  }

  const submitUserUpdate = async () => {
    if (!editingUser) return

    // Validate password if provided
    if (editForm.password) {
      if (editForm.password !== editForm.confirmPassword) {
        toast.error('Passwords do not match')
        return
      }
      if (editForm.password.length < 8) {
        toast.error('Password must be at least 8 characters long')
        return
      }
      // Check password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      if (!passwordRegex.test(editForm.password)) {
        toast.error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
        return
      }
    }

    try {
      const updateData: any = {
        username: editForm.username,
        email: editForm.email,
        role: editForm.role,
        info: {
          first_name: editForm.first_name,
          last_name: editForm.last_name
        }
      }

      // Only include password if it's provided
      if (editForm.password) {
        updateData.password = editForm.password
      }

      await clientAPI.patch(`/user/${editingUser._id}`, updateData)
      toast.success('User updated successfully')
      fetchUsers()
      onEditModalClose()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }

  const submitSuspend = async () => {
    if (!selectedUser) return

    try {
      const suspendData: BanUserPayload = {
        is_banned: !selectedUser.status.is_banned,
        ban_until: banUntil || undefined,
        ban_reason: banReason || undefined
      }

      await clientAPI.patch(`/user/ban/${selectedUser._id}`, suspendData)
      toast.success(suspendData.is_banned ? 'User suspended successfully' : 'User unsuspended successfully')
      fetchUsers()
      onBanModalClose()
    } catch (error) {
      console.error('Error updating user suspension status:', error)
      toast.error('Failed to update user suspension status')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'danger'
      case 'instructor':
        return 'primary'
      case 'student':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '🛠️'
      case 'instructor':
        return '👨‍🏫'
      case 'student':
        return '👨‍🎓'
      default:
        return '👤'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Spinner size="lg" color="primary" label="Loading users..." />
      </div>
    )
  }

  return (
    <>
      <Card className="border-none shadow-lg">
        <CardBody className="p-0">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-divider">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg hero-background">
                <FaGroup className="h-5 w-5 text-background" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">Users Management</h3>
                <p className="text-sm text-default-500">
                  {filteredUsers.length} of {users.length} users
                  {searchQuery && ` (filtered by "${searchQuery}")`}
                </p>
              </div>
            </div>
            <Button 
              onClick={fetchUsers} 
              variant="flat" 
              color="primary"
              size="sm"
              startContent={<SolarRefreshLineDuotone className="h-4 w-4" />}
            >
              Refresh
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="px-4 sm:px-6 py-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                className="flex-1"
                placeholder="Search users by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<MdiSearch className="h-4 w-4 text-default-400" />}
                isClearable
                onClear={() => setSearchQuery('')}
              />
              <div className="flex gap-2">
                <Select
                  className="w-32"
                  placeholder="Role"
                  selectedKeys={[roleFilter]}
                  onSelectionChange={(keys) => setRoleFilter(Array.from(keys)[0] as string)}
                >
                  <SelectItem key="all" value="all">All Roles</SelectItem>
                  <SelectItem key="student" value="student">Student</SelectItem>
                  <SelectItem key="instructor" value="instructor">Instructor</SelectItem>
                  <SelectItem key="admin" value="admin">Admin</SelectItem>
                </Select>
                <Select
                  className="w-32"
                  placeholder="Status"
                  selectedKeys={[statusFilter]}
                  onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
                >
                  <SelectItem key="all" value="all">All Status</SelectItem>
                  <SelectItem key="active" value="active">Active</SelectItem>
                  <SelectItem key="banned" value="banned">Suspended</SelectItem>
                </Select>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-500">Show:</span>
                <Select
                  className="w-20"
                  selectedKeys={[rowsPerPage.toString()]}
                  onSelectionChange={(keys) => setRowsPerPage(Number(Array.from(keys)[0]))}
                >
                  <SelectItem key="5" value="5">5</SelectItem>
                  <SelectItem key="10" value="10">10</SelectItem>
                  <SelectItem key="25" value="25">25</SelectItem>
                  <SelectItem key="50" value="50">50</SelectItem>
                </Select>
                <span className="text-sm text-default-500">per page</span>
              </div>
            </div>
          </div>

          <Table 
            aria-label="Users table"
            classNames={{
              wrapper: "shadow-none",
              th: "bg-default-50 text-default-700 font-semibold",
              td: "py-4"
            }}
          >
            <TableHeader>
              <TableColumn>USER</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>USERNAME</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>CREATED</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent={searchQuery || roleFilter !== 'all' || statusFilter !== 'all' ? "No users match the current filters" : "No users found"}>
              {filteredUsers
                .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                .map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        size="sm"
                        name={user.info?.first_name ? `${user.info.first_name} ${user.info.last_name}` : user.username}
                        className="bg-gradient-to-r from-primary/20 to-secondary/20"
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {user.info?.first_name && user.info?.last_name 
                            ? `${user.info.first_name} ${user.info.last_name}`
                            : user.username
                          }
                        </p>
                        <p className="text-xs text-default-500">ID: {user._id.slice(-6)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{user.email}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-mono">{user.username}</p>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      color={getRoleColor(user.role)} 
                      variant="flat"
                      size="sm"
                      startContent={<span className="text-xs">{getRoleIcon(user.role)}</span>}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Chip 
                        color={user.status?.is_banned ? 'danger' : 'success'} 
                        variant="flat"
                        size="sm"
                      >
                        {user.status?.is_banned ? '🚫 Suspended' : '✅ Active'}
                      </Chip>
                      {user.status?.is_banned && user.status?.ban_until && (
                        <p className="text-xs text-danger-500">
                          Until: {new Date(user.status.ban_until).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-default-600">
                      {user.created_at 
                        ? new Date(user.created_at).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="light" 
                        size="sm"
                        isIconOnly
                        color={user.status?.is_banned ? 'success' : 'warning'}
                        onClick={() => handleSuspendUser(user)}
                      >
                        <span className="text-sm">🚫</span>
                      </Button>
                      <Button 
                        variant="light" 
                        size="sm"
                        isIconOnly
                        color="primary"
                        onClick={() => handleEditUser(user)}
                      >
                        <FeEdit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="light" 
                        size="sm"
                        isIconOnly
                        color="danger"
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        <MdiBin className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {filteredUsers.length > rowsPerPage && (
            <div className="flex justify-center items-center p-4">
              <Pagination
                total={Math.ceil(filteredUsers.length / rowsPerPage)}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                showShadow
                color="primary"
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="lg">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">Edit User</h3>
          </ModalHeader>
          <ModalBody>
            {editingUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                  <Avatar
                    size="sm"
                    name={editingUser.info?.first_name ? `${editingUser.info.first_name} ${editingUser.info.last_name}` : editingUser.username}
                  />
                  <div>
                    <p className="font-medium">
                      {editingUser.info?.first_name && editingUser.info?.last_name 
                        ? `${editingUser.info.first_name} ${editingUser.info.last_name}`
                        : editingUser.username
                      }
                    </p>
                    <p className="text-sm text-default-500">ID: {editingUser._id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    placeholder="Enter first name"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    isRequired
                  />
                  <Input
                    label="Last Name"
                    placeholder="Enter last name"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    isRequired
                  />
                </div>

                <Input
                  label="Username"
                  placeholder="Enter username"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  isRequired
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter email address"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  isRequired
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-default-700">Password Settings</h4>
                    <Button
                      size="sm"
                      variant="flat"
                      color={showPassword ? 'danger' : 'primary'}
                      onClick={() => {
                        setShowPassword(!showPassword)
                        if (!showPassword) {
                          setEditForm({...editForm, password: '', confirmPassword: ''})
                        }
                      }}
                    >
                      {showPassword ? 'Cancel Password Change' : 'Change Password'}
                    </Button>
                  </div>
                  
                  {showPassword && (
                    <div className="space-y-3 p-4 bg-warning-50 rounded-lg border border-warning-200">
                      <p className="text-sm text-warning-700 mb-3">
                        ⚠️ <strong>Warning:</strong> Changing the password will require the user to sign in again with the new password.
                      </p>
                      
                      <Input
                        label="New Password"
                        type="password"
                        placeholder="Enter new password"
                        value={editForm.password}
                        onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                        description="Must be at least 8 characters with uppercase, lowercase, number, and special character"
                      />
                      
                      <Input
                        label="Confirm New Password"
                        type="password"
                        placeholder="Confirm new password"
                        value={editForm.confirmPassword}
                        onChange={(e) => setEditForm({...editForm, confirmPassword: e.target.value})}
                        color={editForm.password && editForm.confirmPassword && editForm.password !== editForm.confirmPassword ? 'danger' : 'default'}
                        errorMessage={editForm.password && editForm.confirmPassword && editForm.password !== editForm.confirmPassword ? 'Passwords do not match' : ''}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-default-700 mb-2">Role</label>
                  <div className="flex gap-2">
                    {(['student', 'instructor', 'admin'] as const).map((role) => (
                      <Button
                        key={role}
                        size="sm"
                        variant={editForm.role === role ? 'solid' : 'flat'}
                        color={editForm.role === role ? getRoleColor(role) : 'default'}
                        onClick={() => setEditForm({...editForm, role})}
                        startContent={<span className="text-xs">{getRoleIcon(role)}</span>}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditModalClose}>
              Cancel
            </Button>
            <Button 
              color="primary"
              onPress={submitUserUpdate}
            >
              {showPassword && editForm.password ? 'Update User & Password' : 'Update User'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Suspend User Modal */}
      <Modal isOpen={isBanModalOpen} onClose={onBanModalClose} size="lg">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">
              {selectedUser?.status?.is_banned ? 'Unsuspend User' : 'Suspend User'}
            </h3>
          </ModalHeader>
          <ModalBody>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                  <Avatar
                    size="sm"
                    name={selectedUser.info?.first_name ? `${selectedUser.info.first_name} ${selectedUser.info.last_name}` : selectedUser.username}
                  />
                  <div>
                    <p className="font-medium">
                      {selectedUser.info?.first_name && selectedUser.info?.last_name 
                        ? `${selectedUser.info.first_name} ${selectedUser.info.last_name}`
                        : selectedUser.username
                      }
                    </p>
                    <p className="text-sm text-default-500">{selectedUser.email}</p>
                  </div>
                </div>

                {!selectedUser.status?.is_banned && (
                  <>
                    <Input
                      type="date"
                      label="Suspend Until (Optional)"
                      placeholder="Select end date for suspension"
                      value={banUntil}
                      onChange={(e) => setBanUntil(e.target.value)}
                      description="Leave empty for permanent suspension"
                    />
                    <Textarea
                      label="Suspension Reason (Optional)"
                      placeholder="Enter reason for suspending this user..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      rows={3}
                    />
                  </>
                )}

                {selectedUser.status?.is_banned && (
                  <div className="p-3 bg-danger-50 rounded-lg border border-danger-200">
                    <p className="text-sm text-danger-700">
                      <strong>Current Suspension Status:</strong>
                    </p>
                    {selectedUser.status.ban_until && (
                      <p className="text-sm text-danger-600">
                        Suspended until: {new Date(selectedUser.status.ban_until).toLocaleDateString()}
                      </p>
                    )}
                    {selectedUser.status.ban_reason && (
                      <p className="text-sm text-danger-600">
                        Reason: {selectedUser.status.ban_reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onBanModalClose}>
              Cancel
            </Button>
            <Button 
              color={selectedUser?.status?.is_banned ? 'success' : 'danger'}
              onPress={submitSuspend}
            >
              {selectedUser?.status?.is_banned ? 'Unsuspend User' : 'Suspend User'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
