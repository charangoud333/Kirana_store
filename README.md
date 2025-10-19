# Kirana Store Management System

A comprehensive internal management system designed for small general store owners to manage daily operations efficiently.

## Features

### Core Modules

1. **Dashboard**
   - Real-time sales, purchases, and profit metrics
   - Low stock alerts
   - Interactive sales trend charts
   - Recent transaction history
   - Quick action buttons for common tasks

2. **Product & Inventory Management**
   - Complete CRUD operations for products
   - Category and brand organization
   - SKU tracking
   - Stock level monitoring with automatic low-stock alerts
   - Buying and selling price management
   - Expiry date tracking
   - Stock value calculation

3. **Sales Entry**
   - Multi-item transaction support
   - Real-time stock availability check
   - Multiple payment types (Cash, UPI, Credit)
   - Automatic inventory updates
   - Bill number generation
   - Customer linkage (optional)

4. **Purchase Entry**
   - Stock-in recording
   - Supplier linkage
   - Invoice tracking
   - Automatic quantity updates
   - Cost price management

5. **Expense Tracking**
   - Categorized expenses (rent, electricity, wages, delivery, miscellaneous)
   - Monthly expense summaries
   - Payment method tracking
   - Date-based filtering

6. **Reports & Analytics**
   - Customizable date range
   - Total sales, purchases, and expenses
   - Net profit/loss calculation
   - Sales trend visualization
   - Detailed P&L statements

7. **Supplier Management**
   - Contact information storage
   - Purchase history tracking
   - Outstanding balance management

8. **Customer Credit Management**
   - Credit customer accounts
   - Credit limit configuration
   - Outstanding balance tracking
   - Payment history

9. **Settings**
   - Store information configuration
   - Business preferences
   - Currency customization
   - Low stock threshold settings
   - Tax rate configuration

### Authentication & Security

- JWT-based authentication via Supabase
- Role-based access control (Owner, Cashier, Helper)
- Row Level Security (RLS) on all database tables
- Protected routes
- Secure session management

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (already configured in `.env`)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

### Initial Setup

See [SETUP.md](./SETUP.md) for detailed instructions on:
- Creating the first owner account
- Database configuration
- Initial system setup
- User management

## User Roles & Permissions

### Owner
- Full system access
- Can manage settings
- Can create/edit/delete all data
- Access to all reports

### Cashier
- Can manage daily operations
- Can record sales, purchases, expenses
- Can manage products, suppliers, customers
- Cannot access settings

### Helper
- Read-only access (view data only)
- No edit or delete permissions

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx       # Main layout with sidebar
│   ├── ProtectedRoute.tsx
│   └── ProductModal.tsx
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication state
├── lib/                 # Utilities and configurations
│   ├── auth.ts          # Auth helpers
│   ├── supabase.ts      # Supabase client
│   └── database.types.ts # TypeScript types
├── pages/               # Page components
│   ├── Dashboard.tsx
│   ├── Products.tsx
│   ├── Sales.tsx
│   ├── Purchases.tsx
│   ├── Expenses.tsx
│   ├── Reports.tsx
│   ├── Suppliers.tsx
│   ├── Customers.tsx
│   ├── Settings.tsx
│   └── Login.tsx
└── App.tsx              # Main app with routing
```

## Database Schema

- **users**: User profiles and roles
- **products**: Product catalog and inventory
- **purchases**: Stock purchase records
- **sales**: Sales transactions
- **sale_items**: Line items for each sale
- **expenses**: Daily expense tracking
- **suppliers**: Supplier contact information
- **customers**: Customer credit accounts
- **payments**: Payment tracking
- **store_settings**: Store configuration

All tables have proper indexes, foreign key relationships, and Row Level Security policies.

## Daily Workflow

1. **Morning**: Check dashboard for low stock alerts
2. **Throughout the day**: Record sales as they happen
3. **When stock arrives**: Record purchases and update inventory
4. **End of day**: Add any expenses incurred
5. **Weekly/Monthly**: Review reports for business insights

## Features Not Included (Future Enhancements)

- Barcode scanning
- WhatsApp notifications
- Bulk CSV import/export
- Print bill functionality
- Dark mode
- Mobile app version
- Backup/restore
- Multi-location support

## Support

For technical support or questions:
- Check browser console for errors
- Review Supabase logs
- Verify RLS policies
- Ensure proper authentication setup

## License

This is a proprietary internal tool for store management.

## Acknowledgments

Built with modern web technologies for efficient store management.
