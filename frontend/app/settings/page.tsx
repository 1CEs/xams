"use client"

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/user.store';
import { clientAPI } from '@/config/axios.config';
import { Card, CardHeader, CardBody, Input, Button, Switch } from '@nextui-org/react';

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

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.username || "");
      setEmail(user.email || "");
      setProfileUrl(user.profile_url || "");
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
        last_name: user?.info?.last_name || ""
      };

      const response = await clientAPI.patch(`/user/${user?._id}`, payload);

      if (response.status === 200 && user) {
        setUser({ 
          ...user, 
          username: name, 
          email: email, 
          profile_url: profileUrl, 
          _id: user._id, 
          role: user.role,
          info: {
            ...user.info
          }
        });
        
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

  return (
    <div className="flex justify-center">
      <Card className="max-w-md w-full mt-16">
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
            
            <Button color="secondary" isLoading={loading} type="submit" isDisabled={!isEditing}>
              Update
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}