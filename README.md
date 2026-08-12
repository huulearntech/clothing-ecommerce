# Modern E-Commerce Platform (Clothing & Apparel)

[![PNPM Workspaces](https://img.shields.io/badge/pnpm-workspaces-yellow.svg)](https://pnpm.io/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vitejs.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![TypeORM](https://img.shields.io/badge/TypeORM-1.1-FE0803.svg)](https://typeorm.io/)

A full-stack, enterprise-grade e-commerce application designed for clothing and fashion retail. Built with a modern **TypeScript Monorepo architecture** powered by **pnpm workspaces**, featuring a sleek **React 19** frontend and a robust **NestJS 11** backend microservice-ready backend.

---

## 📐 Monorepo Architecture

```
shop/
├── apps/
│   ├── web-app/         # React 19 + Vite + Tailwind CSS v4 Client
│   └── server/          # NestJS 11 + TypeORM + PostgreSQL + BullMQ API
├── packages/
│   └── shared-utils/    # Shared TypeScript utilities & types
├── entities_and_relations.mmd # Entity-Relationship Diagram (Mermaid)
├── package.json         # Workspace root configuration
└── pnpm-workspace.yaml  # PNPM workspace layout
```

---

## ✨ Key Features

### 🛍️ Frontend (`web-app`)
* **Modern Stack**: React 19, Vite 8, React Router v7, TanStack Query (React Query v5).
* **UI & Styling**: Tailwind CSS v4, Radix UI & Base UI primitives, Lucide icons, Sonner toast notifications, Recharts analytics dashboards.
* **Themes & UX**: Light/Dark mode via `next-themes`, responsive mobile-first layouts, and smooth animations.

### ⚙️ Backend (`server`)
* **NestJS Modular Architecture**: Decoupled domain modules for auth, catalog, orders, payments, shipping, and reviews.
* **Persistence & ORM**: PostgreSQL with TypeORM mapping complex relational models.
* **Auth & Security**: Argon2 password hashing, JWT authentication & access token validation.
* **Cloud Storage & Communication**: Cloudinary image uploads, Mailgun / Nodemailer integration.

---

## 🗄️ Core Domain & Data Model

The platform encompasses comprehensive fashion e-commerce domains detailed in [`entities_and_relations.mmd`](file:///home/huu/Code/JS/shop/entities_and_relations.mmd):

* **User & Profiles**: Authentication, Customer preferences (sizes, gender preferences), Address book (default shipping/billing).
* **Catalog & Variants**: Products, Multi-attribute Variants (SKU, size, color hex, price override, stock quantities), Categories, Brands, Collections, and Image galleries.
* **Shopping Cart & Wishlist**: Persistent user cart, guest session cart, and customizable wishlists.
* **Orders & Checkout**: Order lifecycle tracking, Voucher & discount code application, Tax/Shipping calculations, Snapshot records for products/addresses.
* **Fulfillment & Returns**: Carrier shipping updates, tracking IDs, item-level return & exchange workflows.
* **Customer Feedback**: Verified purchase reviews, star ratings, fit feedback (true to size, etc.).

---

## 🚀 Getting Started

### Prerequisites

* **Node.js**: `>= 20.x`
* **PNPM**: `^10.28.0` (`corepack enable` or `npm i -g pnpm`)
* **PostgreSQL**: `^16`

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd shop
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**:
   Set up `.env` files in `apps/server` and `apps/web-app` (refer to `.env.example` templates if available).

4. **Seed Database (Server)**:
   ```bash
   pnpm --filter server db:seed
   ```

---

## 💻 Development Commands

From the workspace root:

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Start both **Client** and **Server** concurrently |
| `pnpm dev:client` | Start frontend Vite server (`apps/web-app`) |
| `pnpm dev:server` | Start backend NestJS server in watch mode (`apps/server`) |
| `pnpm --filter server build` | Build backend for production |
| `pnpm --filter web-app build` | Build frontend bundle for production |
| `pnpm --filter server test` | Run server unit tests with Jest |
| `pnpm --filter web-app lint` | Lint frontend codebase with Oxlint |

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
| :--- | :--- |
| **Monorepo Manager** | PNPM Workspaces |
| **Frontend Framework** | React 19, Vite, TypeScript |
| **Frontend Styling** | Tailwind CSS v4, Radix UI, Base UI, Lucide React |
| **State & Data Fetching**| TanStack Query v5, Axios |
| **Backend Framework** | NestJS 11, TypeScript |
| **Database & ORM** | PostgreSQL, TypeORM |
| **Messaging & Queues** | RabbitMQ (amqplib) |
| **Auth & Security** | JWT, Argon2 |
| **Storage & Mail** | Cloudinary, Mailgun |

---

## 📜 License

No License
