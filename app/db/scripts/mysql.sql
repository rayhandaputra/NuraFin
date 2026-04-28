-- MySQL Migration Script for Finance App

CREATE TABLE users (
    id VARCHAR(128) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    app_code VARCHAR(10) UNIQUE,
    linked_user_id VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (linked_user_id) REFERENCES users(id)
);

CREATE TABLE categories (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    commitment_type ENUM('debt', 'fixed', 'savings', 'regular', 'catatan') DEFAULT 'regular',
    color VARCHAR(20),
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sub_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id VARCHAR(128) NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE wallets (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    name VARCHAR(100) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0,
    type ENUM('debit', 'credit') NOT NULL,
    wallet_type ENUM('Bank', 'E-Wallet', 'Cash', 'Lainnya'),
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    color VARCHAR(20),
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    category_id VARCHAR(128),
    sub_category VARCHAR(100),
    type ENUM('income', 'expense') NOT NULL,
    wallet_id VARCHAR(128),
    notes TEXT,
    date DATETIME NOT NULL,
    created_by VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE budgets (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    category_id VARCHAR(128) NOT NULL,
    category_name VARCHAR(100),
    amount_limit DECIMAL(15, 2) NOT NULL,
    period ENUM('Weekly', 'Monthly') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE debts (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    person_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type ENUM('debt', 'loan') NOT NULL,
    borrow_date DATETIME NOT NULL,
    due_date DATETIME,
    status ENUM('active', 'paid') DEFAULT 'active',
    notes TEXT,
    source_transaction_id VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE bundles (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    name VARCHAR(255) NOT NULL,
    date DATETIME NOT NULL,
    status ENUM('active', 'paid') DEFAULT 'active',
    wallet_id VARCHAR(128),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
);

CREATE TABLE bundle_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bundle_id VARCHAR(128) NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    is_checked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE
);
