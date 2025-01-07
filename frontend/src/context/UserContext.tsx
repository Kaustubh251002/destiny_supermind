// context/UserContext.tsx
'use client'
import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the UserContext type
type UserContextType = {
  currentUser: string | null;
  metadata: Record<string, any> | null;
  setUser: (user: string, metadata: Record<string, any>) => void;
};

// Default context values
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null);

  // Function to update the user and metadata
  const setUser = (user: string, metadata: Record<string, any>) => {
    setCurrentUser(user);
    setMetadata(metadata);
  };

  return (
    <UserContext.Provider value={{ currentUser, metadata, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook to use UserContext
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
