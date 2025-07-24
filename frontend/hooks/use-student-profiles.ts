"use client";

import { useState, useEffect } from "react";
import { clientAPI } from "@/config/axios.config";

interface StudentProfile {
  _id: string;
  username: string;
  email: string;
  profile_url: string;
  role: string;
}

export const useStudentProfiles = (studentIds: string[]) => {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!studentIds || studentIds.length === 0) {
        setProfiles([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch student data for each student ID
        const promises = studentIds.slice(0, 4).map(id => 
          clientAPI.get(`/user/${id}`)
            .then(response => ({
              _id: response.data.data._id,
              username: response.data.data.username || 'Unknown',
              email: response.data.data.email || 'No email',
              profile_url: response.data.data.profile_url || `https://i.pravatar.cc/150?u=${response.data.data._id}`,
              role: response.data.data.role || 'student'
            }))
            .catch(error => {
              console.error(`Failed to fetch profile for ${id}:`, error);
              return {
                _id: id,
                username: 'Unknown',
                email: 'No email',
                profile_url: `https://i.pravatar.cc/150?u=${id}`,
                role: 'student'
              };
            })
        );

        const fetchedProfiles = await Promise.all(promises);
        setProfiles(fetchedProfiles);
      } catch (err) {
        console.error('Error fetching student profiles:', err);
        setError('Failed to load student profiles');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [studentIds]);

  return { profiles, isLoading, error };
};
