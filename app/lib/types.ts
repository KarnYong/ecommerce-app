// Customer types
export interface Customer {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export interface CreateCustomerDTO {
  name: string;
  email: string;
}

// Product types
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  created_at: Date;
}

export interface CreateProductDTO {
  name: string;
  price: number;
  stock: number;
}

// Order types
export interface Order {
  id: number;
  customer_id: number;
  total: number;
  status: string;
  created_at: Date;
  customer?: Customer;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: Product;
}

export interface CreateOrderDTO {
  customer_id: number;
  items: {
    product_id: number;
    quantity: number;
  }[];
}

export interface CreateOrderItemDTO {
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Order with details type
export interface OrderWithDetails extends Order {
  customer: Customer;
  items: (OrderItem & { product: Product })[];
}
