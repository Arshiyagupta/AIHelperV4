// Centralized type definitions

import { Database } from '@/lib/database.types';

// Database table types
export type User = Database['public']['Tables']['users']['Row'];
export type Issue = Database['public']['Tables']['issues']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type MediatorLog = Database['public']['Tables']['mediator_logs']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type AIEvent = Database['public']['Tables']['ai_events']['Row'];

// Enum types
export type IssueStatus = Database['public']['Enums']['issue_status'];
export type SenderType = Database['public']['Enums']['sender_type'];
export type NotificationType = Database['public']['Enums']['notification_type'];
export type AIAgentType = Database['public']['Enums']['ai_agent_type'];

// Extended types with relations
export interface UserWithPartner extends User {
  connected_partner?: User;
}

export interface IssueWithDetails extends Issue {
  partner_a?: User;
  partner_b?: User;
  messages?: Message[];
  current_proposal?: MediatorLog;
}

export interface MessageWithSender extends Message {
  sender?: User;
}

export interface NotificationWithPayload extends Notification {
  payload: {
    issue_id?: string;
    proposal_id?: string;
    message?: string;
    [key: string]: any;
  };
}

// API Response types
export interface APIResponse<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
}

export interface UserDataResponse {
  user: UserWithPartner;
  currentIssue: IssueWithDetails | null;
  currentProposal: MediatorLog | null;
  recentMessages: MessageWithSender[];
  unreadNotifications: NotificationWithPayload[];
  resolvedIssues: Issue[];
}

// Form types
export interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

export interface SignInForm {
  email: string;
  password: string;
}

export interface ConnectPartnerForm {
  partnerCode: string;
}

export interface CreateIssueForm {
  title: string;
}

export interface SendMessageForm {
  content: string;
}

// Component prop types
export interface AuthFormProps {
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface MessageBubbleProps {
  message: MessageWithSender;
  isCurrentUser: boolean;
}

export interface IssueCardProps {
  issue: Issue;
  onPress?: () => void;
}

export interface ProposalCardProps {
  proposal: MediatorLog;
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
}

// Navigation types
export interface TabParamList {
  index: undefined;
  chat: undefined;
  history: undefined;
  profile: undefined;
}

export interface RootStackParamList {
  '(tabs)': undefined;
  'partner-code': undefined;
  'solution-proposal': { proposalId: string };
  'resolution-success': undefined;
  'red-flag': undefined;
  '+not-found': undefined;
}

// Hook return types
export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'fcm_token'>>) => Promise<User>;
}

export interface UseNotificationsReturn {
  notifications: NotificationWithPayload[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export interface UseRealTimeDataReturn {
  userData: UserDataResponse | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}