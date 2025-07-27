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
    <div className="flex justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="font-bold text-xl flex justify-between items-center">
          User Settings
          <Switch
            size="sm"
            isSelected={isEditing}
            onValueChange={setIsEditing}
          >
            Edit
          </Switch>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="text"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              isDisabled={!isEditing}
            />
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isDisabled={!isEditing}
            />
            <Input
              type="password"
              label="Password"
              placeholder="Leave blank to keep current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isDisabled={!isEditing}
            />
            <Input
              type="text"
              label="Profile Image URL"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              isDisabled={!isEditing}
            />
            
            <div className="mb-4">
              <Input
                type="text"
                label="Birth Date (MM/DD/YYYY)"
                value={birthDateString}
                onChange={isEditing ? handleManualDateChange : undefined}
                isDisabled={!isEditing}
                placeholder="MM/DD/YYYY"
              />
              {isEditing && (
                <div className="mt-2 text-sm text-gray-500">
                  Enter date in MM/DD/YYYY format
                </div>
              )}
            </div>
            
            <Button color="secondary" isLoading={loading} type="submit" isDisabled={!isEditing}>
              Update
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}