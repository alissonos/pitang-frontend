export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  fullName: string | null;
  email: string;
  role: Role;
  createdAt: string | null;
}
