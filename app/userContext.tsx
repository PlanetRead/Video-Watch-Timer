import React, { createContext, useState, useContext, ReactNode } from 'react';

type UserRole = 'admin' | 'student';

// Create the context type
interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

// Create the context with default values
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider Component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>('student'); // Default role is 'student'

  return (
    <UserContext.Provider value={{ role, setRole }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
