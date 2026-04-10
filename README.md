# ZENITH Procurement ERP 

**A next-generation, high-performance procurement and vendor management ecosystem bridging real-time telemetry with intelligent bidding.**

---

## 1. Problem Statement
Modern enterprise procurement is plagued by fragmented legacy systems, leading to extreme supply chain opacity. Procurement teams struggle with delayed inventory synchronization across disjointed warehouses, while vendors suffer from confusing RFQ pipelines and manual bidding overhead. **ZENITH** solves this by unifying real-time stock telemetry directly within a transparent vendor bidding lifecycle, dramatically accelerating purchase cycles and eliminating blind spots in the supply chain data stream.

## 2. Features
- **Strict Environment Isolation**: Complete separation of Demo (sandbox) and Real modes, preventing any mock logic from overlapping with production telemetry.
- **Live Stock Microservice Sync**: Establish direct API pipelines to internal warehouse FastAPI microservices for automated, real-time SKU volume monitoring.
- **Dynamic Vendor RFQ Bidding**: Fully integrated vendor dashboard empowering external suppliers to review enterprise requirements and dynamically submit digital quotes.
- **Context-Aware Analytics**: Beautiful, Recharts-powered visualization matrices that plot internal spend and inbound/outbound inventory shifts instantly.
- **Automated Verification Gates**: Active GST schema validation (custom offline whitelisting and logic gates) protecting the platform from unverified vendor entry.
- **Centralized Alerting Engine**: Contextual badge monitoring system proactively alerting procurement managers upon breaching stock safety thresholds.

## 3. Tech Stack
### Frontend
- **Framework**: React 18 / Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS (with complex custom layouts and glassmorphism)
- **Routing**: React Router
- **Data Visualization**: Recharts
- **Icons**: Lucide React

### Backend (Stock Microservice)
- **Framework**: FastAPI
- **Language**: Python 3.10+
- **Data Validation**: Pydantic
- **Server Environment**: Uvicorn

## 4. Project Structure
```text
.
├── backend/
│   └── stock_server.py      # Independent FastAPI microservice managing real inventory sync
├── src/
│   ├── app/
│   │   ├── components/      # Reusable UI primitives (badges, cards, interactive navbar/sidebar)
│   │   ├── lib/             # Service singletons (authService, dataService, stockSimulator router)
│   │   ├── pages/
│   │   │   ├── company/     # Procurement admin interfaces (Dashboard, ERP Settings, Inventory)
│   │   │   └── vendor/      # External supplier interfaces (Bidding, Active RFQs, Invoices)
│   │   └── routes.tsx       # Core navigation map enforcing unified layout bindings
│   ├── main.tsx             # Root React DOM entry
│   └── index.css            # Base Tailwind and custom CSS token primitives
├── package.json             # NPM core configuration & scripts
├── vite.config.ts           # Bundling definitions
└── tsconfig.json            # Strict TypeScript compilation rules
```

## 5. Installation & Setup
These instructions cover deploying the complete integrated full-stack environment locally.

1. **Clone the repository**:
   ```bash
   git clone <your-repo-link>
   cd "ZENITH Procurement ERP UI 2"
   ```
2. **Install frontend dependencies**:
   ```bash
   npm install
   ```
3. **Start the Frontend Client**:
   ```bash
   npm run dev
   ```
   *The React interface will launch at `http://localhost:5173`.*
4. **Install Backend Dependencies**:
   Open a separate terminal window inside the root directory.
   ```bash
   pip install fastapi uvicorn pydantic
   ```
5. **Start the Stock Microservice**:
   ```bash
   cd backend
   uvicorn stock_server:app --port 8001 --reload
   ```

## 6. How It Works
1. **Authentication Routing**: Upon arriving at the login gateway, users specify whether they are entering a "Demo" state or logging into a "Company/Vendor" state. The internal `authService` bifurcates data flows natively (`sessionStorage` vs `localStorage` vs `API`).
2. **Real-time Inventory Injection**: For live company administrators, the React client executes periodic asymmetric fetches against the `http://localhost:8001/stock/{id}` microservice.
3. **Payload Normalization**: The API returns high-speed JSON arrays formatted uniquely as `updates`. The frontend map translates zero-value entries into active React `Critical/Out` alert props via conditional logic.
4. **Quotations & RFQs**: A company crafts a Request For Quote (RFQ) mapped via internal UUIDs in the database layer. External vendors read this isolated RFQ through the state layer and construct an integrated `quote`, which dynamically surfaces on the procurer's dashboard.

## 7. Scalability
- **Pluggable Data Bridges**: The frontend `dataService` abstraction seamlessly enables drop-in replacements, meaning the underlying `localStorage` state engine can be hot-swapped for a persistent PostgreSQL client (e.g., via Supabase or a central API) with exactly zero UI rewrites.
- **Microservices Concept**: The strict separation of the React frontend from the independent FastAPI stock server models enterprise microservice decoupling cleanly. Horizontal scaling of the FastAPI endpoints directly aligns with heavy-duty concurrent read requests.
- **Virtual DOM Render Optimization**: The application leverages contextual `useEffect` boundaries and conditional render blocks, preventing global tree renders when an isolated dataset (like live chart metrics) refreshes async tasks.

## 8. Feasibility
Developing and launching this system leverages wildly popular, globally supported tooling (React, Tailwind, FastAPI). There are no proprietary or deprecated experimental physics applied here. Evolving to true production implies routing the FastAPI application into Docker containers, configuring a centralized DB (SQL), binding JWT security to the Auth loops (over existing service scaffolding), and mapping it vertically behind an NGINX ingress controller.

## 9. Novelty
Unlike legacy behemoths (e.g. archaic SAP portals) that strictly isolate internal ERPs from outbound supplier portals, ZENITH breaks the silo. It operates on a bidirectional philosophy where the external vendor has immediate (and secure) graphical exposure to exactly what the procurement officer requires while running in modern, instantaneous single-page architecture that feels fluid, responsive, and utterly untethered from old-era page-refresh loading screens. 

## 10. Feature Depth
- **Zero-overlap Environments**: Demo sessions cleanly nuke their sandbox footprint automatically to ensure testing datasets never contaminate production states.
- **Deep Microservice Linkage**: Stock configurations explicitly allow custom API key binding points and dynamic URL routing natively configured inside the UI Profile dropdown.
- **Strict Type Validation & Verification**: Heavy client-side gatekeeping explicitly forbids malicious actors—utilizing stringent, 15-character physical GST validations over loose form structures.

## 11. Ethical Use & Disclaimer
This is prototype procurement software developed explicitly for the OreHack evaluation engine and demonstration cases. Built-in compliance layers (like the simulated GST hard-coded whitelist) are meant for localized staging logic exclusively and require rigid backend infrastructure replacement to manage real-world enterprise transactional governance models securely.

## 12. License
[MIT License](https://opensource.org/licenses/MIT)

## 13. Author
**Dinesh Sugumar**
Email: *(Provided on GitHub Profile)*
GitHub: *(Add your link here)*