-- PostgreSQL Migration Script for Finance App

CREATE TYPE budget_type AS ENUM ('income', 'expense');
CREATE TYPE commitment_type AS ENUM ('debt', 'fixed', 'savings', 'regular', 'catatan');
CREATE TYPE wallet_main_type AS ENUM ('debit', 'credit');
CREATE TYPE wallet_sub_type AS ENUM ('Bank', 'E-Wallet', 'Cash', 'Lainnya');
CREATE TYPE budget_period AS ENUM ('Weekly', 'Monthly');
CREATE TYPE debt_type AS ENUM ('debt', 'loan');
CREATE TYPE status_type AS ENUM ('active', 'paid');

CREATE TABLE users (
    id VARCHAR(128) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    app_code VARCHAR(10) UNIQUE,
    linked_user_id VARCHAR(128) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type budget_type NOT NULL,
    commitment_type commitment_type DEFAULT 'regular',
    color VARCHAR(20),
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sub_categories (
    id SERIAL PRIMARY KEY,
    category_id VARCHAR(128) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE wallets (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0,
    type wallet_main_type NOT NULL,
    wallet_type wallet_sub_type,
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    color VARCHAR(20),
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    category_id VARCHAR(128) REFERENCES categories(id) ON DELETE SET NULL,
    sub_category VARCHAR(100),
    type budget_type NOT NULL,
    wallet_id VARCHAR(128) REFERENCES wallets(id) ON DELETE SET NULL,
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budgets (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id VARCHAR(128) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    category_name VARCHAR(100),
    amount_limit DECIMAL(15, 2) NOT NULL,
    period budget_period NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE debts (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    person_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type debt_type NOT NULL,
    borrow_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    status status_type DEFAULT 'active',
    notes TEXT,
    source_transaction_id VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bundles (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status status_type DEFAULT 'active',
    wallet_id VARCHAR(128) REFERENCES wallets(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bundle_items (
    id SERIAL PRIMARY KEY,
    bundle_id VARCHAR(128) NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    is_checked BOOLEAN DEFAULT FALSE
);
