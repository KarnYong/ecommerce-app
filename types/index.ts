// API Request and Response Types

export interface Customer {
  id?: number;
  name: string;
  email: string;
  created_at?: Date;
}

export interface Product {
  id?: number;
  name: string;
  price: number | string;
  stock: number;
  created_at?: Date;
}

export interface OrderItemRequest {
  product_id: number;
  quantity: number;
}

export interface CreateOrderRequest {
  customer_id: number;
  items: OrderItemRequest[];
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Order {
  id?: number;
  customer_id: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at?: Date;
  items?: OrderItem[];
  customer?: Customer;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  customer?: Customer;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
}
