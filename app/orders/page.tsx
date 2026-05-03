'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Order, Customer, Product, OrderWithItems, ApiResponse } from '@/types';

interface OrderItemRequest {
  product_id: number;
  quantity: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null);
  const [orderForm, setOrderForm] = useState({
    customer_id: '',
    items: [] as OrderItemRequest[],
  });
  const [statusForm, setStatusForm] = useState({
    status: 'pending' as 'pending' | 'completed' | 'cancelled',
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/orders');
      const data: ApiResponse<OrderWithItems[]> = await res.json();
      if (data.success && data.data) {
        setOrders(data.data);
      } else {
        setError(data.error || 'Failed to fetch orders');
      }
    } catch (_err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data: ApiResponse<Customer[]> = await res.json();
      if (data.success && data.data) {
        setCustomers(data.data);
      }
    } catch (_err) {
      console.error('Failed to fetch customers');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data: ApiResponse<Product[]> = await res.json();
      if (data.success && data.data) {
        setProducts(data.data);
      }
    } catch (_err) {
      console.error('Failed to fetch products');
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
  }, []);

  const resetForm = () => {
    setOrderForm({ customer_id: '', items: [] });
    setShowForm(false);
    setEditingOrder(null);
  };

  const addItem = () => {
    if (products.length > 0) {
      setOrderForm({
        ...orderForm,
        items: [...orderForm.items, { product_id: products[0].id!, quantity: 1 }],
      });
    }
  };

  const removeItem = (index: number) => {
    setOrderForm({
      ...orderForm,
      items: orderForm.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: keyof OrderItemRequest, value: string | number) => {
    const newItems = [...orderForm.items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'quantity' ? Math.max(1, parseInt(value as string) || 1) : parseInt(value as string),
    };
    setOrderForm({ ...orderForm, items: newItems });
  };

  const calculateTotal = () => {
    return orderForm.items.reduce((total, item) => {
      const product = products.find(p => p.id === item.product_id);
      return total + (product ? parseFloat(product.price as any) * item.quantity : 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderForm.customer_id || orderForm.items.length === 0) {
      setError('Please select a customer and add at least one item');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: parseInt(orderForm.customer_id),
          items: orderForm.items,
        }),
      });
      const data: ApiResponse<Order> = await res.json();

      if (data.success) {
        resetForm();
        fetchOrders();
      } else {
        setError(data.error || 'Failed to create order');
      }
    } catch (_err) {
      setError('Failed to connect to server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this order? Stock will be restored.')) return;

    try {
      setError(null);
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      const data: ApiResponse = await res.json();

      if (data.success) {
        fetchOrders();
      } else {
        setError(data.error || 'Failed to delete order');
      }
    } catch (_err) {
      setError('Failed to connect to server');
    }
  };

  const handleStatusEditClick = (order: OrderWithItems) => {
    setEditingOrder(order);
    setStatusForm({ status: order.status });
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusForm.status }),
      });
      const data: ApiResponse<Order> = await res.json();

      if (data.success) {
        setEditingOrder(null);
        fetchOrders();
      } else {
        setError(data.error || 'Failed to update order status');
      }
    } catch (_err) {
      setError('Failed to connect to server');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Orders</h1>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Order'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Status Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={handleStatusSubmit} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Order Status</h2>
            <p className="text-sm text-gray-600 mb-4">
              Order #{editingOrder.id} - {editingOrder.customer?.name}
            </p>
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusForm.status}
                onChange={(e) => setStatusForm({ status: e.target.value as 'pending' | 'completed' | 'cancelled' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Update Status'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Order Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Order</h2>

          <div className="mb-4">
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              id="customer"
              value={orderForm.customer_id}
              onChange={(e) => setOrderForm({ ...orderForm, customer_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">Order Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                + Add Item
              </button>
            </div>

            {orderForm.items.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No items added yet</p>
            ) : (
              <div className="space-y-2">
                {orderForm.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select
                      value={item.product_id}
                      onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ${parseFloat(product.price as any).toFixed(2)} ({product.stock} in stock)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-900 p-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {orderForm.items.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Order Total:</span>
                <span className="text-lg font-bold text-gray-900">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || orderForm.items.length === 0}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs">
                        {order.items?.map((item, i) => (
                          <div key={i} className="text-xs">
                            {item.quantity}x {item.product?.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${parseFloat(order.total as any).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleStatusEditClick(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit Status
                      </button>
                      <button
                        onClick={() => order.id && handleDelete(order.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
