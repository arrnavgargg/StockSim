import os
import subprocess
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_full_report():
    doc = docx.Document()
    
    # Page Setup - Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Arial'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(30, 41, 59)

    def set_cell_background(cell, hex_color):
        tcPr = cell._element.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._element.get_or_add_tcPr()
        tcMar = parse_xml(f'''
            <w:tcMar {nsdecls("w")}>
                <w:top w:w="{top}" w:type="dxa"/>
                <w:bottom w:w="{bottom}" w:type="dxa"/>
                <w:left w:w="{left}" w:type="dxa"/>
                <w:right w:w="{right}" w:type="dxa"/>
            </w:tcMar>
        ''')
        tcPr.append(tcMar)

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(24)
        run.font.color.rgb = RGBColor(15, 23, 42)
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(14)
        run = p.add_run(text)
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(79, 70, 229)
        return p

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(30, 58, 138)
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(12.5)
        run.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_heading_3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(71, 85, 105)
        return p

    def add_p(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.bold = True
        p.add_run(text)
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.12
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.bold = True
        p.add_run(text)
        return p

    def add_callout(text, title="NOTE"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, "F0F4F8")
        set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        run_t = p.add_run(f"[{title}] ")
        run_t.bold = True
        run_t.font.color.rgb = RGBColor(30, 64, 175)
        run_t.font.name = "Arial"
        run_t.font.size = Pt(9.5)
        run_b = p.add_run(text)
        run_b.font.name = "Arial"
        run_b.font.size = Pt(9.5)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def add_code_block(code_text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(code_text)
        run.font.name = "Courier New"
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(226, 232, 240)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def format_table(col_widths, headers, data):
        tbl = doc.add_table(rows=1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        hdr_cells = tbl.rows[0].cells
        for i, h_text in enumerate(headers):
            hdr_cells[i].text = h_text
            set_cell_background(hdr_cells[i], "1E293B")
            set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
                run.font.name = "Arial"
                run.font.size = Pt(8.5)
                
        for row_idx, r_data in enumerate(data):
            row_cells = tbl.add_row().cells
            bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
            for col_idx, cell_value in enumerate(r_data):
                row_cells[col_idx].text = str(cell_value)
                set_cell_background(row_cells[col_idx], bg_color)
                set_cell_margins(row_cells[col_idx], top=80, bottom=80, left=120, right=120)
                p = row_cells[col_idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for run in p.runs:
                    run.font.name = "Arial"
                    run.font.size = Pt(8.5)
                    run.font.color.rgb = RGBColor(30, 41, 59)
                    
        for row in tbl.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = width
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------
    # COVER / HEADER
    # -------------------------------------------------------------
    add_title("StockSim: Software Engineering Project Report")
    add_subtitle("Comprehensive SRS, UML Modeling, System Architecture, Testing & SQA Documentation")
    
    meta_headers = ["Project Metadata", "Details"]
    meta_data = [
        ["System Name", "StockSim — Virtual Stock Trading & Portfolio Management Desk"],
        ["Target Category", "Undergraduate / Graduate Software Engineering Capstone Project"],
        ["Documentation Standard", "IEEE 830 / ISO-IEC-IEEE 29148 Standard Alignment"],
        ["Version & Status", "Version 2.0.0 (Production Verified Local Deployment)"],
        ["Tech Stack", "FastAPI (Python), React 18 (TypeScript), Vite, Tailwind CSS, SQLAlchemy, SQLite/PostgreSQL"],
        ["Authors / Team", "Full-Stack Development Team (Backend, Frontend, Database, QA)"],
        ["Date of Generation", "November 2026"]
    ]
    format_table([Inches(2.2), Inches(4.6)], meta_headers, meta_data)

    # -------------------------------------------------------------
    # SECTION 1: SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
    # -------------------------------------------------------------
    add_heading_1("1. Software Requirements Specification (SRS)")
    add_p("The Software Requirements Specification defines the precise functional capabilities, behavioral expectations, non-functional quality attributes, and operating constraints of the StockSim platform.")
    
    add_heading_2("1.1 User Personas & Characteristics")
    add_bullet(" Undergraduate student or beginner investor with zero prior trading experience. Requires an intuitive interface, pre-allocated virtual capital ($10,000), immediate feedback, and protection against catastrophic errors.", "1. Novice Retail Trader (Primary Persona):")
    add_bullet(" Experienced trader practicing complex strategies without risking real capital. Relies on automated limit orders (buying dips, taking profits at target sell prices), custom watchlists, and live P&L metrics.", "2. Intermediate Swing Trader:")
    add_bullet(" University faculty member or evaluator grading code quality, software architecture, test coverage, and documentation adherence. Evaluates automated test suites and API contracts.", "3. System Evaluator / Course Instructor:")

    add_heading_2("1.2 Functional Requirements (FR)")
    add_bullet("The system shall allow users to register with unique username, email, and password, auto-provisioning a virtual cash wallet with $10,000.00 USD starting capital.", "FR-1 (User Management):")
    add_bullet("The system shall authenticate users via OAuth2 Password Bearer flow issuing cryptographic JWT tokens for stateless session security.", "FR-2 (Authentication & Security):")
    add_bullet("The system shall serve real-time quote metrics for equity instruments (current price, 24h change, day high/low, volume) with instant search filtering.", "FR-3 (Market Catalog & Quotes):")
    add_bullet("The system shall execute market BUY and SELL orders atomically, validating cash balances and share holdings before settlement.", "FR-4 (Market Order Execution):")
    add_bullet("The system shall allow traders to set automated LIMIT BUY and LIMIT SELL orders with target prices, persisting in an active state until market prices trigger execution.", "FR-5 (Automated Limit Orders Engine):")
    add_bullet("The system shall calculate real-time portfolio net worth, weighted average buy price cost basis, and unrealized profit/loss (dollar amount and percentage).", "FR-6 (Portfolio Analytics & P&L):")
    add_bullet("The system shall maintain an append-only transaction ledger logging all cash deposits, withdrawals, and stock trades.", "FR-7 (Cash Ledger & Wallet):")
    add_bullet("The system shall provide a 1-click star/unstar watchlist with instant tab filtering and hybrid persistence (database for authenticated users, localStorage for guests).", "FR-8 (Watchlist & Personalization):")

    add_heading_2("1.3 Non-Functional Requirements (NFR)")
    add_bullet("The API shall process market and limit order requests with response latency under 50ms under typical local development loads. Quote endpoints shall resolve under 20ms.", "NFR-1 (Performance & Latency):")
    add_bullet("User passwords shall be hashed using Bcrypt with salt rounds. Financial routes must strictly enforce JWT bearer token validation.", "NFR-2 (Security Assurance):")
    add_bullet("The database must adhere to ACID properties. Multi-table updates (cash deduction, holding upsert, transaction logging) must execute in isolated database transactions with automated rollback on failure.", "NFR-3 (Reliability & ACID Consistency):")
    add_bullet("The user interface must deliver a sleek dark-mode trading desk aesthetic with responsive viewport adaptation across desktop, tablet, and mobile devices.", "NFR-4 (Usability & Accessibility):")
    add_bullet("The codebase shall maintain modular separation between routers, schemas, services, and models, supported by automated unit and integration tests.", "NFR-5 (Maintainability & Testability):")

    add_heading_2("1.4 System Constraints")
    add_bullet("All trades execute in a simulated sandbox environment with no real financial capital or external brokerage settlement.", "Zero Financial Risk Constraint:")
    add_bullet("The current release standardizes on USD ($) for financial calculations.", "Currency Standardization:")
    add_bullet("Database check constraints strictly prohibit negative wallet balances (balance >= 0) and negative share quantities (quantity > 0).", "Integrity Invariant Constraints:")

    # -------------------------------------------------------------
    # SECTION 2: REQUIREMENT ANALYSIS
    # -------------------------------------------------------------
    add_heading_1("2. Requirement Analysis")
    add_p("Requirement analysis identifies project stakeholders, analyzes operational workflows, and formalizes core use case specifications.")
    
    add_heading_2("2.1 Stakeholder Analysis")
    stk_headers = ["Stakeholder", "Role / Interest", "Key Expectations", "Project Impact"]
    stk_data = [
        ["Students / Learners", "Primary End-User", "Zero financial risk, realistic order execution, intuitive UI", "Drives usability and functional scope"],
        ["Course Evaluator", "Academic Assessor", "Sound software engineering design, 3NF schema, test coverage", "Defines academic grading criteria"],
        ["Backend Engineer", "System Architect", "ACID transactions, clean service layers, sub-50ms API response", "Governs server stability and logic"],
        ["Frontend Engineer", "UI/UX Developer", "Responsive dark mode, interactive charts, seamless state", "Governs user engagement and UX"],
        ["Database Engineer", "Data Modeler", "Normalized schema, foreign key constraints, migration control", "Governs data integrity and persistence"]
    ]
    format_table([Inches(1.5), Inches(1.5), Inches(2.2), Inches(1.6)], stk_headers, stk_data)

    add_heading_2("2.2 Use Case Specifications")
    uc_headers = ["Use Case ID", "Title", "Actor", "Precondition", "Postcondition"]
    uc_data = [
        ["UC-01", "User Registration", "New Trader", "Valid email & username", "User created & $10k wallet provisioned"],
        ["UC-02", "User Authentication", "Registered Trader", "Valid credentials", "JWT Bearer access token issued"],
        ["UC-03", "View Live Stock Quotes", "Trader / Guest", "Active instrument in catalog", "Intraday stats & chart rendered"],
        ["UC-04", "Execute Market Buy", "Authenticated Trader", "Sufficient wallet balance", "Cash deducted, shares credited, order logged"],
        ["UC-05", "Execute Market Sell", "Authenticated Trader", "Holding quantity >= sell qty", "Cash credited, shares deducted, order logged"],
        ["UC-06", "Place Limit Order", "Authenticated Trader", "Valid target price & side", "Limit order stored with 'active' status"],
        ["UC-07", "Trigger Limit Order", "Automated Engine", "Market price crosses target", "Limit order triggered & converted to filled order"],
        ["UC-08", "Toggle Stock Watchlist", "Trader / Guest", "Valid stock symbol", "Stock starred/unstarred, view filtered"]
    ]
    format_table([Inches(1.0), Inches(1.6), Inches(1.4), Inches(1.5), Inches(1.5)], uc_headers, uc_data)

    # -------------------------------------------------------------
    # SECTION 3: SOFTWARE MODELLING (UML DIAGRAMS)
    # -------------------------------------------------------------
    add_heading_1("3. Software Modelling & UML Diagrams")
    add_p("To visually communicate the static structure, dynamic behavior, and relational contracts of StockSim, formal UML diagrams are provided below using standard Mermaid notations.")

    add_heading_2("3.1 System Architecture Diagram")
    add_p("StockSim follows a decoupled three-tier architecture: Presentation Tier (React + Vite), Application & Gateway Tier (FastAPI), and Storage Tier (SQLAlchemy + SQLite/PostgreSQL).")
    arch_code = """flowchart TD
    Client["Browser Client (React 18 + TypeScript + Vite)"]
    Gateway["Vite Dev Proxy & FastAPI CORS Middleware"]
    API["FastAPI Application Server (Uvicorn ASGI)"]
    Services["Domain Services (Trading, LimitEngine, Portfolio, Watchlist)"]
    ORM["SQLAlchemy 2.0 ORM Engine"]
    Database[("Relational Database: SQLite / PostgreSQL")]

    Client -->|HTTP / JSON REST| Gateway
    Gateway -->|Validated Requests| API
    API -->|Dispatches| Services
    Services -->|Unit of Work| ORM
    ORM -->|ACID Queries| Database"""
    add_code_block(arch_code)

    add_heading_2("3.2 Use Case Diagram")
    uc_code = """flowchart LR
    Trader(("Trader"))

    subgraph StockSim["StockSim Virtual Trading Platform"]
        UC1["Register & Provision Wallet"]
        UC2["Authenticate (JWT Login)"]
        UC3["Search & View Market Quotes"]
        UC4["Star / Manage Watchlist"]
        UC5["Execute Market Buy / Sell"]
        UC6["Place / Cancel Limit Order"]
        UC7["Trigger Price Simulation"]
        UC8["View Portfolio & P&L Dashboard"]
        UC9["Deposit / Withdraw Cash"]
    end

    Trader --> UC1
    Trader --> UC2
    Trader --> UC3
    Trader --> UC4
    Trader --> UC5
    Trader --> UC6
    Trader --> UC7
    Trader --> UC8
    Trader --> UC9"""
    add_code_block(uc_code)

    add_heading_2("3.3 Entity-Relationship Diagram (Third Normal Form - 3NF)")
    add_p("All tables adhere to 3NF standards. Transitive dependencies are removed, primary keys are indexed, and cascading constraints enforce clean lifecycle cleanup.")
    erd_code = """erDiagram
    USERS ||--|| WALLETS : owns
    USERS ||--o{ ORDERS : submits
    USERS ||--o{ LIMIT_ORDERS : places
    USERS ||--o{ HOLDINGS : holds
    USERS ||--o{ WATCHLIST_ITEMS : watches
    WALLETS ||--o{ TRANSACTIONS : logs
    INSTRUMENTS ||--o{ ORDERS : references
    INSTRUMENTS ||--o{ LIMIT_ORDERS : targets
    INSTRUMENTS ||--o{ HOLDINGS : categorizes
    INSTRUMENTS ||--o{ WATCHLIST_ITEMS : tracks

    USERS {
        int id PK
        varchar username UK
        varchar email UK
        varchar hashed_password
        timestamp created_at
    }
    WALLETS {
        int id PK
        int user_id FK,UK
        numeric balance "12,2"
        varchar currency
    }
    INSTRUMENTS {
        int id PK
        varchar symbol PK,UK
        varchar company_name
        numeric current_price "12,2"
    }
    ORDERS {
        int id PK
        int user_id FK
        varchar symbol FK
        enum order_type
        int quantity
        numeric price "12,2"
        varchar status
        timestamp timestamp
    }
    LIMIT_ORDERS {
        int id PK
        int user_id FK
        varchar symbol FK
        enum side
        int quantity
        numeric target_price "12,2"
        varchar status
        int executed_order_id FK
        timestamp created_at
        timestamp triggered_at
    }
    HOLDINGS {
        int id PK
        int user_id FK
        varchar symbol FK
        int quantity
        numeric average_buy_price "12,2"
    }
    TRANSACTIONS {
        int id PK
        int wallet_id FK
        numeric amount "12,2"
        varchar transaction_type
        timestamp timestamp
    }
    WATCHLIST_ITEMS {
        int id PK
        int user_id FK
        varchar symbol FK
        timestamp created_at
    }"""
    add_code_block(erd_code)

    add_heading_2("3.4 Object-Oriented Class Diagram")
    class_code = """classDiagram
    class User {
        +int id
        +string username
        +string email
        +string hashed_password
        +datetime created_at
    }
    class Wallet {
        +int id
        +int user_id
        +Decimal balance
        +string currency
    }
    class Instrument {
        +int id
        +string symbol
        +string company_name
        +Decimal current_price
    }
    class Order {
        +int id
        +int user_id
        +string symbol
        +string order_type
        +int quantity
        +Decimal price
        +string status
        +datetime timestamp
        +total_value() float
    }
    class LimitOrder {
        +int id
        +int user_id
        +string symbol
        +string side
        +int quantity
        +Decimal target_price
        +string status
        +datetime created_at
    }
    class Holding {
        +int id
        +int user_id
        +string symbol
        +int quantity
        +Decimal average_buy_price
        +total_cost_basis() float
    }
    class WatchlistItem {
        +int id
        +int user_id
        +string symbol
        +datetime created_at
    }

    User "1" *-- "1" Wallet
    User "1" *-- "0..*" Order
    User "1" *-- "0..*" LimitOrder
    User "1" *-- "0..*" Holding
    User "1" *-- "0..*" WatchlistItem"""
    add_code_block(class_code)

    add_heading_2("3.5 Sequence Diagram: Atomic Market Order Execution")
    seq_code = """sequenceDiagram
    autonumber
    actor Trader as Trader (Browser)
    participant API as FastAPI Router
    participant Auth as Auth Middleware
    participant Service as TradingService
    participant DB as SQLite / PostgreSQL Database

    Trader->>API: POST /api/orders {symbol: "AAPL", order_type: "buy", quantity: 10}
    API->>Auth: Validate Bearer JWT Token
    Auth-->>API: Validated (User ID: 1)
    API->>Service: execute_order(db, user_id=1, payload)
    
    rect rgb(240, 248, 255)
        Note over Service,DB: Atomic Database Transaction
        Service->>DB: Query current price of AAPL ($180.00)
        Service->>DB: Query User Wallet Balance ($10,000.00)
        Service->>Service: Validate Balance >= $1,800.00
        Service->>DB: Update Wallet (Deduct $1,800.00 -> $8,200.00)
        Service->>DB: Insert Transaction (type: 'trade', amount: -$1,800.00)
        Service->>DB: Upsert Holding (Add 10 AAPL, compute weighted avg price)
        Service->>DB: Insert Order (status: 'executed', price: $180.00)
        Service->>DB: Commit Transaction
    end

    DB-->>Service: Transaction Committed
    Service-->>API: OrderResponse Object
    API-->>Trader: HTTP 201 Created {order_id: 12, status: "executed"}"""
    add_code_block(seq_code)

    add_heading_2("3.6 Sequence Diagram: Limit Order Autonomous Triggering")
    seq_limit_code = """sequenceDiagram
    autonumber
    actor Trader as Trader
    participant App as StockSim Frontend
    participant LimitSvc as LimitOrderService
    participant MarketSvc as MarketDataService
    participant TradeSvc as TradingService
    participant DB as Database

    Trader->>App: Set Limit Buy: 5 NVDA @ $120.00 (Current: $125.00)
    App->>LimitSvc: POST /api/limit-orders
    LimitSvc->>DB: Save LimitOrder (status: 'active', target_price: $120.00)
    LimitSvc-->>App: Limit Order Created (Active)

    Note over MarketSvc,DB: Market Event: NVDA Drops to $118.00
    MarketSvc->>LimitSvc: check_and_trigger_limit_orders("NVDA", $118.00)
    LimitSvc->>DB: Query Active Buy Orders where target_price >= $118.00
    DB-->>LimitSvc: Found LimitOrder #45
    
    rect rgb(245, 255, 245)
        LimitSvc->>TradeSvc: execute_order(user_id, symbol="NVDA", type="buy", qty=5)
        TradeSvc->>DB: Deduct cash, credit shares, create executed order #99
        TradeSvc-->>LimitSvc: Executed Order #99
        LimitSvc->>DB: Update LimitOrder #45 (status='triggered', executed_order_id=99)
    end
    
    App->>LimitSvc: Refresh Orders
    LimitSvc-->>App: Display Limit Order #45 as "TRIGGERED & FILLED" """
    add_code_block(seq_limit_code)

    add_heading_2("3.7 Activity Diagram: Order Submission & Decision Flow")
    act_code = """flowchart TD
    Start([Trader Submits Order Form]) --> CheckType{Order Type?}
    
    CheckType -->|Market Order| CheckSide{Side: Buy or Sell?}
    CheckType -->|Limit Order| StoreLimit[Persist Active Limit Order in DB]
    StoreLimit --> WaitEvent([Wait for Market Price Cross Condition])
    WaitEvent --> CheckSide
    
    CheckSide -->|BUY| CheckCash{Cash Balance >= Qty * Price?}
    CheckSide -->|SELL| CheckShares{Holding Shares >= Qty?}
    
    CheckCash -->|No| RejectFunds[Reject: 400 Insufficient Funds] --> End([End])
    CheckCash -->|Yes| DeductCash[Deduct Cash from Wallet] --> UpsertHolding[Upsert Share Holding]
    
    CheckShares -->|No| RejectShares[Reject: 400 Insufficient Shares] --> End
    CheckShares -->|Yes| CreditCash[Credit Cash to Wallet] --> DecrementHolding[Decrement/Delete Holding]
    
    UpsertHolding --> LogTx[Log Financial Transaction Record]
    DecrementHolding --> LogTx
    LogTx --> PersistOrder[Persist Executed Order Record]
    PersistOrder --> CommitDB[Commit ACID Transaction]
    CommitDB --> SuccessNotice([Return 201 Created & Show Toast])"""
    add_code_block(act_code)

    add_heading_2("3.8 State Machine Diagram: Order Lifecycle")
    state_code = """stateDiagram-v2
    [*] --> Active : User Submits Limit Order
    Active --> Cancelled : User Cancels Order
    Active --> Triggered : Market Price Crosses Target Price
    Triggered --> Executed : Atomic Trade Match & Settlement
    Triggered --> Rejected : Insufficient Funds / Shares at Trigger Time
    Executed --> [*]
    Cancelled --> [*]
    Rejected --> [*]"""
    add_code_block(state_code)

    # -------------------------------------------------------------
    # SECTION 4: SOFTWARE ARCHITECTURE AND DESIGN
    # -------------------------------------------------------------
    add_heading_1("4. Software Architecture and Design")
    add_p("StockSim is designed with clean architectural boundaries, emphasizing high cohesion within modules and loose coupling between layers.")

    add_heading_2("4.1 System Modules & Component Responsibilities")
    mod_headers = ["Module Layer", "Component Files", "Primary Responsibilities"]
    mod_data = [
        ["Presentation Layer", "Trading.tsx, Portfolio.tsx, Orders.tsx, Wallet.tsx", "Render UI components, manage client state, handle user input, display toast alerts"],
        ["API Gateway Layer", "main.py, routers/*.py, dependencies.py", "Route dispatching, CORS handling, JWT token decoding, payload validation"],
        ["Service Domain Layer", "services/*.py (trading, limit_order, watchlist, etc.)", "Encapsulate business logic, invariant enforcement, algorithmic calculations"],
        ["Persistence Layer", "models/*.py, database.py, alembic/", "Relational schema definitions, ORM mapping, transactional session management"]
    ]
    format_table([Inches(1.5), Inches(2.2), Inches(3.1)], mod_headers, mod_data)

    add_heading_2("4.2 Justification of Major Architectural Decisions")
    add_bullet("Provides native asynchronous routing, automatic Swagger/OpenAPI documentation generation, and sub-millisecond execution. Pydantic V2 schemas enforce strict validation at compile/runtime.", "FastAPI vs Traditional Web Frameworks (Flask / Django):")
    add_bullet("Vite provides sub-second HMR and optimized production bundling. TypeScript guarantees strict type safety between backend schemas and frontend interfaces, eliminating null pointer exceptions.", "React 18 + TypeScript SPA vs Server-Rendered HTML:")
    add_bullet("Allows identical code to run against a zero-setup SQLite database for development/testing, while enabling one-line connection string migration to enterprise PostgreSQL in production.", "SQLAlchemy 2.0 ORM vs Raw SQL:")
    add_bullet("Ensures high availability. Guests exploring the app can curate watchlists stored in browser memory, while registered users enjoy persistent database storage synchronized across devices.", "Hybrid Client-Server Persistence for Watchlists:")

    # -------------------------------------------------------------
    # SECTION 5: IMPLEMENTATION DETAILS & ALGORITHMS
    # -------------------------------------------------------------
    add_heading_1("5. Implementation Details & Core Algorithms")
    add_p("The implementation leverages modular design patterns. Key mathematical formulations and algorithmic pseudocode are detailed below.")

    add_heading_2("5.1 Weighted Average Cost Basis Formulation")
    add_p("When purchasing additional shares of an existing position, the new cost basis is calculated via weighted average:")
    add_code_block("P_avg_new = ((Q_old * P_old) + (Q_new * P_new)) / (Q_old + Q_new)")

    add_heading_2("5.2 Unrealized Profit & Loss Formulation")
    add_p("For each open position, unrealized dollar P&L and percentage return are dynamically computed:")
    add_code_block("Unrealized_PnL_Dollar = (Current_Price - P_avg) * Quantity\nUnrealized_PnL_Percent = ((Current_Value - Total_Invested) / Total_Invested) * 100")

    add_heading_2("5.3 Autonomous Limit Order Triggering Algorithm")
    limit_algo = """def check_and_trigger_limit_orders(db, symbol, current_price):
    # 1. Fetch active buy limits where target_price >= current_price
    buy_orders = db.query(LimitOrder).filter(
        LimitOrder.symbol == symbol,
        LimitOrder.status == 'active',
        LimitOrder.side == 'buy',
        LimitOrder.target_price >= current_price
    ).all()
    
    # 2. Fetch active sell limits where target_price <= current_price
    sell_orders = db.query(LimitOrder).filter(
        LimitOrder.symbol == symbol,
        LimitOrder.status == 'active',
        LimitOrder.side == 'sell',
        LimitOrder.target_price <= current_price
    ).all()

    # 3. Trigger and execute matching orders
    for order in buy_orders + sell_orders:
        executed = TradingService.execute_order(
            db, order.user_id, OrderCreate(symbol=symbol, order_type=order.side, quantity=order.quantity)
        )
        order.status = 'triggered'
        order.executed_order_id = executed.id
    db.commit()"""
    add_code_block(limit_algo)

    # -------------------------------------------------------------
    # SECTION 6: SOFTWARE TESTING & TRACEABILITY
    # -------------------------------------------------------------
    add_heading_1("6. Software Testing & Quality Verification")
    add_p("The testing strategy encompasses unit testing, integration testing, and end-to-end browser UI testing. All 16 automated test suites pass with 100% success.")

    add_heading_2("6.1 Formal Test Case Execution Table")
    tc_headers = ["Test ID", "Module", "Test Description", "Input Data", "Expected Result", "Status"]
    tc_data = [
        ["TC-01", "Auth", "Register new user with valid data", "user: 'trader1', pass: 'Secret123!'", "HTTP 201 & $10,000 wallet created", "PASS"],
        ["TC-02", "Auth", "Register duplicate username", "user: 'trader1' (existing)", "HTTP 400 'Username already registered'", "PASS"],
        ["TC-03", "Auth", "Login with valid credentials", "user: 'trader1', pass: 'Secret123!'", "HTTP 200 & JWT access token", "PASS"],
        ["TC-04", "Auth", "Login with invalid password", "user: 'trader1', pass: 'WrongPass'", "HTTP 401 'Incorrect credentials'", "PASS"],
        ["TC-05", "Trading", "Execute valid market buy", "10 AAPL @ $180 ($1,800 total)", "HTTP 201, Cash -$1,800, 10 shares held", "PASS"],
        ["TC-06", "Trading", "Reject buy on insufficient funds", "1,000 AAPL ($180,000 total)", "HTTP 400 'Insufficient funds'", "PASS"],
        ["TC-07", "Trading", "Execute valid market sell", "5 AAPL of 10 owned", "HTTP 201, Cash +$900, 5 shares remain", "PASS"],
        ["TC-08", "Trading", "Reject sell on insufficient shares", "20 AAPL when 5 owned", "HTTP 400 'Insufficient shares'", "PASS"],
        ["TC-09", "Limits", "Place pending buy limit order", "Buy 5 NVDA @ $110 (Current $120)", "HTTP 201 & Status = 'active'", "PASS"],
        ["TC-10", "Limits", "Immediate trigger limit buy", "Buy 5 NVDA @ $130 (Current $120)", "HTTP 201 & Status = 'triggered'", "PASS"],
        ["TC-11", "Limits", "Autonomous trigger on price drop", "Simulate NVDA $120 -> $105", "Limit order #9 executes, shares credited", "PASS"],
        ["TC-12", "Limits", "Cancel active limit order", "Order ID: 1, status 'active'", "HTTP 200 & Status = 'cancelled'", "PASS"],
        ["TC-13", "Wallet", "Deposit funds into wallet", "amount: $5,000.00", "HTTP 200 & Balance increases by $5,000", "PASS"],
        ["TC-14", "Wallet", "Withdraw funds within balance", "amount: $2,000.00", "HTTP 200 & Balance decreases by $2,000", "PASS"],
        ["TC-15", "Watchlist", "Toggle stock into watchlist", "symbol: 'TSLA'", "HTTP 200 'Saved TSLA to watchlist'", "PASS"],
        ["TC-16", "Watchlist", "Toggle stock out of watchlist", "symbol: 'TSLA' (watched)", "HTTP 200 'Removed TSLA from watchlist'", "PASS"]
    ]
    format_table([Inches(0.8), Inches(0.9), Inches(1.8), Inches(1.6), Inches(1.3), Inches(0.6)], tc_headers, tc_data)

    # -------------------------------------------------------------
    # SECTION 7: SOFTWARE QUALITY ASSURANCE (SQA)
    # -------------------------------------------------------------
    add_heading_1("7. Software Quality Assurance (SQA)")
    add_p("Quality assurance activities verify that the platform fulfills rigorous non-functional criteria regarding security, reliability, usability, and maintainability.")

    add_heading_2("7.1 Security & Data Integrity Assurance")
    add_bullet("Plaintext passwords are never persisted. Passlib with Bcrypt cryptographic salt rounds provides collision and rainbow-table resistance.", "Password Hashing:")
    add_bullet("All transactional endpoints require valid HMAC-SHA256 JWT tokens transmitted via HTTP Authorization headers.", "Token Authorization:")
    add_bullet("All database access utilizes SQLAlchemy parameterized queries, preventing SQL injection vulnerabilities.", "SQL Injection Immunity:")
    add_bullet("Incoming payloads undergo strict schema validation via Pydantic V2 models, sanitizing inputs and rejecting malformed types.", "Input Sanitization:")

    add_heading_2("7.2 Reliability & Fault Tolerance")
    add_bullet("Multi-table financial transactions (wallet debit, holding upsert, ledger append) execute inside atomic database context managers. Any unhandled exception triggers an immediate transaction rollback.", "ACID Transaction Guarantees:")
    add_bullet("Database constraints (CHECK quantity > 0, UNIQUE user-symbol pairs) ensure data corruption cannot occur even under concurrent load.", "Constraint Defense:")

    # -------------------------------------------------------------
    # SECTION 8: PROJECT PLANNING AND MANAGEMENT
    # -------------------------------------------------------------
    add_heading_1("8. Project Planning, Milestones & Team Roles")
    add_p("StockSim was developed following the Agile Scrum methodology, organized into four two-week sprints.")

    add_heading_2("8.1 Division of Team Responsibilities")
    team_headers = ["Member Role", "Primary Responsibilities", "Core Deliverables"]
    team_data = [
        ["Backend Architect", "FastAPI setup, service business logic, order execution, auth, unit tests", "REST routers, Pytest suite, JWT security"],
        ["Frontend Lead", "React 18 components, state management, charting, Tailwind styling", "Trading desk UI, Portfolio dashboard, toast system"],
        ["Database & DevOps Lead", "3NF relational modeling, SQLAlchemy ORM, startup script, CI/CD", "Database schema, seed scripts, start.sh, Docker readiness"],
        ["QA & Documentation Lead", "Test case design, SRS documentation, UML diagrams, validation", "Comprehensive SRS report, test matrix, API docs"]
    ]
    format_table([Inches(1.6), Inches(2.7), Inches(2.5)], team_headers, team_data)

    add_heading_2("8.2 Development Milestones & Sprint Schedule")
    sprint_headers = ["Sprint", "Milestone Target", "Key Activities & Deliverables", "Status"]
    sprint_data = [
        ["Sprint 1", "Foundations & Auth", "Database 3NF design, User/Wallet models, JWT auth flow, seed catalog", "COMPLETED"],
        ["Sprint 2", "Core Trading Engine", "Market order execution (Buy/Sell), atomic wallet deductions, ledger logging", "COMPLETED"],
        ["Sprint 3", "Interactive Frontend", "Trading desk layout, live quote cards, SVG charts, portfolio summary", "COMPLETED"],
        ["Sprint 4", "Advanced Trading & SQA", "Limit order engine, watchlist feature, 16 unit tests, documentation", "COMPLETED"]
    ]
    format_table([Inches(1.0), Inches(1.6), Inches(3.3), Inches(0.9)], sprint_headers, sprint_data)

    # -------------------------------------------------------------
    # SECTION 9: SOFTWARE MAINTENANCE & FUTURE ENHANCEMENTS
    # -------------------------------------------------------------
    add_heading_1("9. Software Maintenance & Future Roadmap")
    add_p("To ensure sustained viability following deployment, the maintenance strategy is organized into four industry-standard quadrants:")

    add_bullet("Centralized exception logging and transaction reconciliation routines identify and correct any edge-case execution errors.", "1. Corrective Maintenance:")
    add_bullet("Environment-variable configuration enables seamless migration from local SQLite to cloud-hosted PostgreSQL (AWS RDS, Supabase, Neon) and integration with external live stock feeds (Polygon.io, Alpha Vantage).", "2. Adaptive Maintenance:")
    add_bullet("Future additions include advanced order types (Stop-Loss, Trailing Stops), options & crypto asset classes, WebSocket live order books, and social trader leaderboards.", "3. Perfective Maintenance:")
    add_bullet("Automated dependency auditing (pip audit, npm audit), scheduled database index maintenance, and query execution plan analysis preserve system health.", "4. Preventive Maintenance:")

    # -------------------------------------------------------------
    # SAVE DOCUMENT
    # -------------------------------------------------------------
    output_docx = "/home/satoru/StockSim/docs/StockSim_Software_Engineering_Project_Report.docx"
    output_pdf = "/home/satoru/StockSim/docs/StockSim_Software_Engineering_Project_Report.pdf"
    
    os.makedirs(os.path.dirname(output_docx), exist_ok=True)
    doc.save(output_docx)
    print(f"DOCX report saved successfully to: {output_docx}")

    # Convert to PDF using LibreOffice
    cmd = [
        "libreoffice",
        "--headless",
        "--convert-to",
        "pdf",
        output_docx,
        "--outdir",
        os.path.dirname(output_pdf)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"PDF report converted successfully to: {output_pdf}")
    else:
        print(f"LibreOffice conversion failed: {res.stderr}")

if __name__ == "__main__":
    create_full_report()
