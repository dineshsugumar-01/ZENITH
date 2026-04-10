# ZENITH Procurement ERP — Architecture & Tech Stack

This document provides a clear, highly-organized breakdown of the technical stack, architectural decisions, and implementation logic powering the ZENITH Procurement ERP ecosystem. 

---

## 🏗️ 1. Core Technology Stack

The application is built leveraging modern, high-performance tooling to ensure an instantaneous user experience coupled with a decoupled, microservice-ready backend.

### Frontend
* **Core Library**: React 18
* **Language**: TypeScript
* **Build Tool**: Vite (Lightning-fast HMR and optimized production bundles)
* **Styling**: Tailwind CSS (Leveraging arbitrary values and deep custom CSS token abstraction, specifically implementing a glassmorphism and modern gradient design language)
* **Routing**: React Router (Handling localized SPAs across complex nested dashboards)
* **Data Visualization**: Recharts (Responsive, accessible D3-based charting components)
* **Iconography**: Lucide React

### Backend / Microservice
* **Framework**: FastAPI (High-performance, async machine-learning ready API routing)
* **Language**: Python 3.10+
* **Data Validation**: Pydantic (Providing strict runtime type validation for all inbound payload schematics)
* **Server**: Uvicorn (ASGI web server implementation)

---

## ⚙️ 2. Architectural Philosophy

ZENITH fundamentally splits the user base into distinct "Sandboxes" to ensure extreme data integrity. 

### A. Dual-Engine Storage Lifecycle
To facilitate safe demonstration scenarios without polluting enterprise pipelines:
1. **Demo Company/Vendor Mode**: Completely disjointed from real network calls. Operates using volatile `sessionStorage`. Once the tab closes, the internal environment resets, guaranteeing zero data leakage.
2. **Real Login Mode**: Real company administrators operate on a persistent data fabric (`localStorage` bound for database migration) and actively transmit/receive payloads against the live `stock_server.py` microservices.

### B. Decoupled Microservice Telemetry
Unlike monolithic ERPs, the warehouse and stock management logic is ripped entirely out of the frontend monolith.
* The frontend initiates periodic stateless requests directly to `http://localhost:8001/stock/{company_id}`.
* Stock ingestion supports asynchronous *Bulk Syncing* logic, validating external physical inventory systems dynamically, parsing payloads recursively mapped to the `itemName`/`quantity` specifications.

---

## 🧩 3. Data Flow & Implementation Mechanisms

### Authentication (`authService`)
* **State Hook**: Singleton service class abstracts away raw storage API limits.
* **Flow**: Login explicitly dictates `isDemo`. All subsequent components invoke `authService.isDemo()` before attempting live network connections. Demo configurations instantly short-circuit backend network calls, falling gracefully back to local mock matrices. 

### Global State (`dataService`)
* Consolidates all core entities (Companies, Vendors, Items, Orders, Invoices).
* Exerts custom referential integrity checking (e.g. cross-verifying active Vendor quotes against active RFQ UUIDs).
* Enforces stringent **GST Scheme Verification**. Incoming registrations map against an internal 15-character physical whitelist dictionary, preventing malicious bot influx.

### Live Inventory Subsystem (`inventory.tsx`)
* **Conditional Pipeline**: Bypasses the localized dummy `useStockSimulator` completely if connected via a real administrator login.
* **Intelligent Abstraction**: Strips generic monetary tracking dynamically on the table UI, ensuring the application interface morphs to reflect exact backend payloads—calculating logical warning badges (`Critical`, `Low`) based explicitly on active unit degradation rather than hardcoded presets.

---

## 🎨 4. Design & Component Strategy

* **Tailwind Master Variables**: The `$ZENITH` theme relies on native `index.css` global variable definitions ensuring that colors, radiuses, and shadow-filters seamlessly pivot.
* **Component Primitives**: The UI is structured into reusable, atomic-scale React widgets:
  * `<Card>` / `<Badge>` / `<Input>` — Abstracted, ensuring a unified visual grammar.
  * **Dynamic Navigation**: Context-aware routing maps (sidebars and headers) inherently recognize the user's explicit role (`Vendor` vs `Company`) and hide irrelevant interface features intuitively.

---

## 🚀 5. Scaling Mechanics
Moving to explicit production scale involves replacing the internal `dataService` JSON adapters with a persistent PostgreSQL mapper (facilitated by Prisma or generic DB endpoints) and proxying the frontend traffic through standardized Docker/NGINX controllers. The entire codebase has been decoupled via these wrapper classes to ensure this migration requires exactly **zero** UI lifecycle rewriting.
