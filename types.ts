export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// This interface is for client-side use, Supabase handles the user object from auth
export interface UserProfile {
  id: string; // Corresponds to Supabase auth user id
  full_name: string;
  email: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
}

export interface ServiceOrder {
  id: string;
  vehicle_id: string;
  user_id: string;
  service_date: string;
  services: string[];
  notes: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
}