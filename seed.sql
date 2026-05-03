-- E-commerce database seed data

USE ecommerce;

-- Clear existing data
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE products;
TRUNCATE TABLE customers;

-- Insert sample customers
INSERT INTO customers (name, email) VALUES
    ('John Doe', 'john.doe@example.com'),
    ('Jane Smith', 'jane.smith@example.com'),
    ('Bob Johnson', 'bob.johnson@example.com'),
    ('Alice Williams', 'alice.williams@example.com'),
    ('Charlie Brown', 'charlie.brown@example.com');

-- Insert sample products
INSERT INTO products (name, price, stock) VALUES
    ('Laptop', 999.99, 50),
    ('Wireless Mouse', 29.99, 200),
    ('Keyboard', 79.99, 150),
    ('Monitor', 299.99, 75),
    ('USB-C Cable', 12.99, 500),
    ('Webcam', 59.99, 100),
    ('Headphones', 149.99, 80),
    ('Desk Lamp', 34.99, 120),
    ('Notebook', 8.99, 300),
    ('Pen Pack', 5.99, 400);

-- Insert sample orders
INSERT INTO orders (customer_id, total, status) VALUES
    (1, 1059.98, 'completed'),
    (2, 379.98, 'completed'),
    (3, 209.98, 'pending'),
    (4, 159.98, 'completed'),
    (5, 44.98, 'pending');

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
    (1, 1, 1, 999.99),
    (1, 2, 1, 29.99),
    (2, 4, 1, 299.99),
    (2, 3, 1, 79.99),
    (3, 5, 2, 12.99),
    (3, 6, 1, 59.99),
    (4, 7, 1, 149.99),
    (4, 5, 1, 12.99),
    (5, 8, 1, 34.99),
    (5, 9, 1, 8.99);
