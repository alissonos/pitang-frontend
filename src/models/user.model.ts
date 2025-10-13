export interface Role {
  id: number;
  name: string;
  displayName: string;
}

export interface User {
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY';
  id: number;
  username: string;
  fullName: string | null;
  email: string;
  roleId: Role;
  createdAt: string | null;
}
