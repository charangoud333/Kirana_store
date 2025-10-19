# Kirana Store Management System - Setup Guide

## Database Setup

The database schema has been automatically created in Supabase with the following tables:
- users (user profiles with roles)
- products (inventory catalog)
- purchases (stock-in records)
- sales (transaction records)
- sale_items (line items for sales)
- expenses (daily expenses)
- suppliers (supplier contacts)
- customers (customer credit accounts)
- payments (payment tracking)
- store_settings (store configuration)

## Creating the First Owner Account

Since this is your first time setting up, you need to create an owner account:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user" and create a new user with:
   - Email: your-email@example.com
   - Password: your-secure-password
   - Confirm the email automatically
4. After creating the user, go to Table Editor > users table
5. Click "Insert row" and add:
   - id: (copy the user ID from auth.users)
   - role: owner
   - full_name: Your Name
   - status: active

### Option 2: Using SQL

Run this SQL in the Supabase SQL Editor (replace the values):

```sql
-- First, create the auth user (do this in Supabase Dashboard > Authentication)
-- Then insert the profile:
INSERT INTO users (id, role, full_name, phone, status)
VALUES (
  'USER_ID_FROM_AUTH_USERS',  -- Replace with actual user ID
  'owner',
  'Store Owner Name',
  '+91 98765 43210',
  'active'
);
```

## First Login

1. Navigate to the application URL
2. Use the email and password you created
3. You'll be logged in as the owner with full access

## Adding More Users

Once logged in as owner:
1. Go to Settings page (only accessible to owners)
2. Configure your store details
3. You can create additional users (cashiers, helpers) through the Supabase dashboard following the same process

## Default Settings

The system comes with default settings:
- Currency: ₹ (Indian Rupee)
- Low Stock Threshold: 10 units
- Tax Rate: 0%

You can customize these in the Settings page.

## Roles & Permissions

- **Owner**: Full access to all features including settings and user management
- **Cashier**: Can manage sales, purchases, products, expenses, suppliers, and customers
- **Helper**: Read-only access to view data (future implementation)

## Quick Start Workflow

1. **Add Suppliers**: Go to Suppliers page and add your supplier contacts
2. **Add Products**: Navigate to Products and add your inventory items
3. **Record Purchases**: Use Purchases page to record stock arrivals
4. **Make Sales**: Use Sales page to record customer transactions
5. **Track Expenses**: Add daily expenses in Expenses page
6. **View Reports**: Check Reports page for business insights

## Features Overview

### Dashboard
- Today's sales, purchases, and profit summary
- Low stock alerts
- Sales trend charts
- Recent transactions

### Products Management
- Add/Edit/Delete products
- Track inventory levels
- Low stock warnings
- Category and brand filtering

### Sales Entry
- Multi-item billing
- Cash, UPI, and credit payment types
- Automatic stock updates
- Customer tracking (optional)

### Purchase Entry
- Record stock arrivals
- Link to suppliers
- Automatic inventory updates
- Invoice tracking

### Expense Tracking
- Categorized expenses (rent, electricity, wages, delivery, misc)
- Monthly summaries
- Payment method tracking

### Reports
- Date range filtering
- Sales trends visualization
- Profit & Loss statements
- Revenue breakdown

### Supplier Management
- Contact information
- Purchase history
- Outstanding balance tracking

### Customer Management
- Credit customer accounts
- Credit limit setting
- Outstanding balance tracking

### Settings
- Store information
- Business preferences
- Low stock thresholds
- Tax configuration

## Support

For issues or questions:
1. Check the Supabase logs for database errors
2. Check browser console for frontend errors
3. Verify RLS policies are properly set up

## Security Notes

- All tables have Row Level Security (RLS) enabled
- Users can only access data according to their role
- Owners have full access, cashiers have limited access
- Authentication is handled securely by Supabase Auth
