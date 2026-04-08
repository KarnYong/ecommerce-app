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
('USB-C Cable', 14.99, 500),
('Mechanical Keyboard', 149.99, 75),
('Monitor Stand', 49.99, 100),
('Webcam HD', 79.99, 60),
('External SSD 1TB', 129.99, 80),
('Headphones', 199.99, 40),
('Desk Lamp', 34.99, 150),
('USB Hub', 24.99, 300);

-- Insert sample orders
INSERT INTO orders (customer_id, total, status) VALUES
(1, 1059.98, 'completed'),
(2, 164.98, 'completed'),
(3, 24.99, 'pending'),
(4, 329.98, 'completed'),
(5, 44.98, 'pending');

-- Insert sample order items
-- Order 1: John Doe - Laptop + Wireless Mouse
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 999.99),
(1, 2, 2, 29.99);

-- Order 2: Jane Smith - Mechanical Keyboard + USB-C Cable
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(2, 4, 1, 149.99),
(2, 3, 1, 14.99);

-- Order 3: Bob Johnson - USB Hub
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(3, 10, 1, 24.99);

-- Order 4: Alice Williams - External SSD + Headphones
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(4, 7, 1, 129.99),
(4, 8, 1, 199.99);

-- Order 5: Charlie Brown - Monitor Stand + USB-C Cable
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(5, 5, 1, 49.99),
(5, 3, 1, 14.99);
