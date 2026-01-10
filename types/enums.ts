// Conversații
export enum ConversationType {
  PRIVATE = 'private',
  GROUP = 'group',
}

// Proiecte
export enum ProjectStatus {
  NEW = 'new',
  IN_PROGRESS = 'in progress',
  COMPLETED = 'completed',
}

// Task-uri
export enum TaskStatus {
  NEW = 'new',
  IN_PROGRESS = 'in progress',
  PAUSED = 'paused',
  TO_CHECK = 'to check',
  COMPLETED = 'completed',
  RETURNED = 'returned',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// Utilizatori
export enum UserRole {
  ROOT = 'root',
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project manager',
  DEVELOPER = 'developer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}
