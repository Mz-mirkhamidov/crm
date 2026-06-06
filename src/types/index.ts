export type Tag = 'AJR' | 'Estet' | 'Excel' | string;

export type LeadStatus =
  | 'Yangi'
  | 'Ko\'rib chiqilmoqda'
  | 'Kelishildi'
  | 'Rad etildi'
  | 'Buyurtma berilgan';

export type OrderProduct =
  | 'AJR Sedan'
  | 'MEN'
  | 'Women'
  | 'Kids'
  | 'Estet';

export type OrderType = 'Hozirgi' | 'Keyinroqi';

export type FollowUpStatus = 'Kutilmoqda' | 'Bajarildi';

export type SourceType = 'lead' | 'client';

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address: string;
  tag: Tag;
  status: LeadStatus;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  source_type: SourceType;
  source_id: string;
  product: OrderProduct;
  price: number;
  order_type: OrderType;
  scheduled_date: string | null;
  comment: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  source_name?: string;
  source_phone?: string;
}

export interface FollowUp {
  id: string;
  user_id: string;
  source_type: SourceType;
  source_id: string;
  scheduled_at: string;
  note: string;
  status: FollowUpStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  source_name?: string;
  source_phone?: string;
}

export interface DashboardStats {
  todayLeads: number;
  totalOrders: number;
  totalOrdersAmount: number;
  todayFollowUps: number;
  todayDeadlineOrders: number;
  todayFollowUpsList: FollowUp[];
  todayOrdersList: Order[];
  last7DaysLeads: { date: string; count: number }[];
}
