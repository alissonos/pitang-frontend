export interface Role {
  id: number;
  name: string;
  displayName: string;
}

export interface User {
  id: number;
  username: string;
  fullName: string | null;
  email: string;
  roleId: Role;
  createdAt: string | null;
}
