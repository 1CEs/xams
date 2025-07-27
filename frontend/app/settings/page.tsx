"use client"

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/user.store';
import { clientAPI } from '@/config/axios.config';
import { Card, CardHeader, CardBody, Input, Button, Switch } from '@nextui-org/react';
import { DateValue, CalendarDate } from "@internationalized/date";
import { toast } from 'react-toastify';

// Define the UserResponse interface
interface UserResponse {
  _id: string;
  username: string;
  email: string;
  profile_url: string;
  role: string;
  info?: {
    first_name: string;
    last_name: string;
    birth: Date;
  };
}

export default function SettingsPage() {
  const { user, setUser } = useUserStore();
  const [userData, setUserData] = useState<UserResponse | null>(user);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Add missing state variables
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [birthDate, setBirthDate] = useState<CalendarDate | null>(null);
  const [birthDateString, setBirthDateString] = useState<string>("");

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.username || "");
      setEmail(user.email || "");
      setProfileUrl(user.profile_url || "");
      
      // Set birth date if available
      if (user.info?.birth) {
        const date = new Date(user.info.birth);
        setBirthDate(new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()));
        setBirthDateString(date.toLocaleDateString());
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create a payload with the updated user data
      const payload: any = {
        username: name,
        email: email,
        profile_url: profileUrl,
      };
      
      // Only include password if it's not empty
      if (password) {
        payload.password = password;
      }
      
      // Ensure we have the required fields for the info object
      payload.info = {
        first_name: user?.info?.first_name || "",
        last_name: user?.info?.last_name || "",
        // Always provide a Date object for birth
        birth: birthDate ? birthDate.toDate('UTC') : new Date(0), // Use a default date if null
      };

      const response = await clientAPI.patch(`/users/${user?._id}`, payload);

      if (response.status === 200 && user) {
        const updatedBirthDate = birthDate ? birthDate.toDate('UTC') : (user.info?.birth || new Date(0));
        
        setUser({ 
          ...user, 
          username: name, 
          email: email, 
          profile_url: profileUrl, 
          _id: user._id, 
          role: user.role,
          info: {
            ...user.info,
            birth: updatedBirthDate
          }
        });
        
        // Update the displayed date string
        setBirthDateString(updatedBirthDate.toLocaleDateString());
        
        toast.success('User updated successfully!');
      } else {
        toast.error('Failed to update user.');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while updating user.');
    } finally {
      setLoading(false);
    }
  };
  const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthDateString(e.target.value);
    
    // Try to parse the date from the string
    try {
      const parts = e.target.value.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[0]);
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        
        if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
          setBirthDate(new CalendarDate(year, month, day));
        }
      }
    } catch (error) {
      console.error("Error parsing date:", error);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-default-700 mb-2">Account Settings</h1>
          <p className="text-default-500 text-sm sm:text-base">Manage your profile information and preferences</p>
        </div>

        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
              <div>
                <h2 className="font-bold text-xl sm:text-2xl text-default-700">Profile Settings</h2>
                <p className="text-default-500 text-sm mt-1">Update your personal information</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-600">{isEditing ? 'Editing' : 'View Only'}</span>
                <Switch
                  size="sm"
                  isSelected={isEditing}
                  onValueChange={setIsEditing}
                  color="primary"
                >
                  Edit Mode
                </Switch>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-default-700 border-b border-default-200 pb-2">
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="Username"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    isDisabled={!isEditing}
                    size="sm"
                    classNames={{
                      input: "text-sm sm:text-base",
                      label: "text-sm sm:text-base"
                    }}
                  />
                  <Input
                    type="email"
                    label="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    isDisabled={!isEditing}
                    size="sm"
                    classNames={{
                      input: "text-sm sm:text-base",
                      label: "text-sm sm:text-base"
                    }}
                  />
                </div>
              </div>

              {/* Security Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-default-700 border-b border-default-200 pb-2">
                  Security
                </h3>
                
                <Input
                  type="password"
                  label="New Password"
                  placeholder="Leave blank to keep current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  isDisabled={!isEditing}
                  size="sm"
                  description="Enter a new password only if you want to change it"
                  classNames={{
                    input: "text-sm sm:text-base",
                    label: "text-sm sm:text-base",
                    description: "text-xs sm:text-sm"
                  }}
                />
              </div>

              {/* Profile Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-default-700 border-b border-default-200 pb-2">
                  Profile Details
                </h3>
                
                <Input
                  type="url"
                  label="Profile Image URL"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  isDisabled={!isEditing}
                  size="sm"
                  placeholder="https://example.com/your-image.jpg"
                  classNames={{
                    input: "text-sm sm:text-base",
                    label: "text-sm sm:text-base"
                  }}
                />
                
                <div className="space-y-2">
                  <Input
                    type="text"
                    label="Birth Date"
                    value={birthDateString}
                    onChange={isEditing ? handleManualDateChange : undefined}
                    isDisabled={!isEditing}
                    placeholder="MM/DD/YYYY"
                    size="sm"
                    classNames={{
                      input: "text-sm sm:text-base",
                      label: "text-sm sm:text-base"
                    }}
                  />
                  {isEditing && (
                    <p className="text-xs sm:text-sm text-default-500 ml-1">
                      Enter date in MM/DD/YYYY format
                    </p>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-default-200">
                <Button 
                  color="secondary" 
                  isLoading={loading} 
                  type="submit" 
                  isDisabled={!isEditing}
                  className="w-full sm:w-auto min-w-[120px]"
                  size="md"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
                {isEditing && (
                  <Button 
                    variant="flat" 
                    onPress={() => {
                      setIsEditing(false);
                      // Reset form to original values
                      if (user) {
                        setName(user.username || "");
                        setEmail(user.email || "");
                        setPassword("");
                        setProfileUrl(user.profile_url || "");
                        if (user.info?.birth) {
                          const date = new Date(user.info.birth);
                          setBirthDate(new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()));
                          setBirthDateString(date.toLocaleDateString());
                        }
                      }
                    }}
                    className="w-full sm:w-auto"
                    size="md"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}