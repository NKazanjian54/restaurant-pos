-- Insert sample categories
INSERT INTO categories (name, description) VALUES 
('Burgers', 'All types of burgers'),
('Sides', 'Side dishes and appetizers'),
('Beverages', 'Soft drinks and beverages'),
('Desserts', 'Sweet treats and desserts');

-- Insert sample products
INSERT INTO products (name, description, price, category_id, sku, stock_quantity) VALUES 
('Classic Burger', 'Beef patty with lettuce, tomato, onion', 8.99, 1, 'BUR001', 50),
('Cheeseburger', 'Classic burger with cheese', 9.99, 1, 'BUR002', 45),
('Chicken Sandwich', 'Grilled chicken breast sandwich', 9.49, 1, 'BUR003', 30),
('French Fries', 'Golden crispy fries', 3.99, 2, 'SID001', 100),
('Onion Rings', 'Battered and fried onion rings', 4.49, 2, 'SID002', 75),
('Coca-Cola', 'Classic Coke', 2.49, 3, 'BEV001', 200),
('Sprite', 'Lemon-lime soda', 2.49, 3, 'BEV002', 150),
('Chocolate Shake', 'Rich chocolate milkshake', 4.99, 4, 'DES001', 25);

-- Insert sample admin user (password: admin123 - hashed with bcrypt)
INSERT INTO users (username, email, password_hash, role, first_name, last_name) VALUES 
('admin', 'admin@restaurant.com', '$2b$10$rQZ1zXKjH4I8J5lHrY7I7.HJYbZbfRVAO1fV6.dYAFkKOkKDjLFYK', 'admin', 'Admin', 'User'),
('cashier1', 'cashier@restaurant.com', '$2b$10$rQZ1zXKjH4I8J5lHrY7I7.HJYbZbfRVAO1fV6.dYAFkKOkKDjLFYK', 'cashier', 'John', 'Doe');