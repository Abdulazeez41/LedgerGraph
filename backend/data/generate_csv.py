import csv
import os
import random
from datetime import datetime, timedelta

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

def generate_datasets():
    # 1. CUSTOMERS (20 commercial B2B SME entities in an emerging / frontier trade economy)
    customers = [
        # id, name, phone, email, address, business_type, credit_limit, risk_score, created_at
        ("CUST-001", "BrightMart Hardware Ltd", "+1-800-555-0199", "sales@brightmart-trade.com", "Plot 442, Industrial Free Zone, Sector 4", "Retailer", 50000, 45, "2025-01-10"),
        ("CUST-002", "Metro Commercial Ventures", "+1-800-555-0199", "info@metroventures.com", "Plot 442, Industrial Free Zone, Sector 4", "Contractor", 30000, 85, "2025-02-14"),
        ("CUST-003", "Apex Global Builders Ltd", "+1-800-111-4455", "procurement@apexgroup-global.com", "12 Commercial Boulevard, Financial District", "Construction", 150000, 30, "2024-11-01"),
        ("CUST-004", "Horizon Aggregate Supplies", "+1-800-777-3322", "procurement@apexgroup-global.com", "Quarry Road, Sector 8 Logistics Hub", "Trader", 40000, 78, "2025-03-20"),
        ("CUST-005", "Frontier InfraTech Ltd", "+1-800-333-8811", "projects@frontierinfratech.com", "Suite 104, Trade Towers, Central District", "Infrastructure", 120000, 25, "2024-08-15"),
        ("CUST-006", "Crestline Heights Engineering", "+1-800-333-8811", "admin@crestlineheights.com", "Plot 78, Eastern Hills Development", "Developer", 80000, 72, "2025-04-12"),
        ("CUST-007", "Valley Mechanics & Steel", "+1-800-444-9900", "info@valleysteel.com", "Shed 14, Regional Wholesale Market", "Wholesaler", 60000, 40, "2025-02-01"),
        ("CUST-008", "Summit Hardware Merchants", "+1-800-666-2211", "summithardware@trade.com", "Shed 14, Regional Wholesale Market", "Retailer", 25000, 80, "2025-05-18"),
        ("CUST-009", "Pioneer Builders Hub", "+1-800-888-1234", "accounts@fasttrack-builders.com", "4 Expressway Junction, North Corridor", "Cooperative", 35000, 65, "2025-06-05"),
        ("CUST-010", "FastTrack Construction Ltd", "+1-800-999-5678", "accounts@fasttrack-builders.com", "Sector F, Airport Logistics Area", "Residential Builder", 70000, 75, "2025-01-28"),
        ("CUST-011", "Prime Continental Structures", "+1-800-123-4567", "info@primecontinental.com", "8 Embassy Crescent, Capital District", "Luxury Developer", 250000, 15, "2024-05-10"),
        ("CUST-012", "Continental Block Works", "+1-800-987-6543", "continentalblocks@trade.com", "Industrial Area 10, East Zone", "Manufacturer", 45000, 20, "2024-09-12"),
        ("CUST-013", "Modern Luxury Interiors", "+1-800-345-6789", "hello@moderninteriors.com", "Commercial Avenue, Uptown Axis", "Interior Contractor", 50000, 35, "2025-03-01"),
        ("CUST-014", "Central Materials Depot", "+1-800-456-7890", "centralmaterials@trade.com", "Central Municipal Market", "Merchant", 30000, 50, "2025-04-15"),
        ("CUST-015", "Metro Modern Homes", "+1-800-678-9012", "contact@metromodern.com", "Phase 4, Suburban Corridor", "Residential Contractor", 65000, 30, "2024-12-05"),
        ("CUST-016", "Pacific Prime Developments", "+1-800-567-8901", "tenders@pacificprime.com", "Nelson Street, Commercial Zone", "Commercial Contractor", 200000, 18, "2024-06-20"),
        ("CUST-017", "Civil Infrastructure Contractors", "+1-800-112-2334", "info@civilinfra.com", "Plot 102, Central Trade District", "Civil Engineering", 180000, 22, "2024-07-08"),
        ("CUST-018", "Capital Ceramics & Allied", "+1-800-223-3445", "orders@capitalceramics.com", "Transit Road, Port Logistics Area", "Retailer", 55000, 38, "2025-02-22"),
        ("CUST-019", "Delta Timber & Concrete", "+1-800-334-4556", "info@deltatimber.com", "Wholesale Timber Yard, West Dock", "Timber & Concrete", 40000, 60, "2025-05-02"),
        ("CUST-020", "Alliance Civil Works", "+1-800-445-5667", "alliancecivil@trade.com", "Engineering Junction, Highway Hub", "Infrastructure", 75000, 42, "2025-03-14"),
    ]

    with open(os.path.join(DATA_DIR, "customers.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "name", "phone", "email", "address", "business_type", "credit_limit", "risk_score", "created_at"])
        writer.writerows(customers)

    # 2. SUPPLIERS (6 wholesale commodity suppliers & manufacturers)
    suppliers = [
        ("SUPP-001", "Continental Cement Corp", "+1-800-271-2200", "sales@continentalcement.com", 3),
        ("SUPP-002", "Pacific Cement Industries", "+1-800-461-0669", "orders@pacificcement.com", 4),
        ("SUPP-003", "Atlas Steel Mills Ltd", "+1-800-280-5500", "steel@atlassteel.com", 7),
        ("SUPP-004", "Horizon Roofing & Ceilings", "+1-800-774-8800", "info@horizonroofing.com", 5),
        ("SUPP-005", "Pioneer Wires and Cables", "+1-800-280-9900", "info@pioneercables.com", 4),
        ("SUPP-006", "Apex Ceramic Works", "+1-800-342-7711", "sales@apexceramics.com", 6),
    ]

    with open(os.path.join(DATA_DIR, "suppliers.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "name", "phone", "email", "lead_time_days"])
        writer.writerows(suppliers)

    # 3. PRODUCTS (16 building materials & industrial hardware inventory items)
    products = [
        ("PROD-001", "Portland Commercial Cement 50kg", "Cement", 8.5, 1400, "SUPP-001"),
        ("PROD-002", "High-Strength 42.5R Cement 50kg", "Cement", 9.2, 950, "SUPP-001"),
        ("PROD-003", "Pozzolanic Hydraulic Cement 50kg", "Cement", 8.2, 750, "SUPP-002"),
        ("PROD-004", "High-Yield TMT Rebar 12mm (Length)", "Steel", 14.5, 500, "SUPP-003"),
        ("PROD-005", "High-Yield TMT Rebar 16mm (Length)", "Steel", 25.0, 380, "SUPP-003"),
        ("PROD-006", "High-Yield TMT Rebar 10mm (Length)", "Steel", 9.8, 620, "SUPP-003"),
        ("PROD-007", "Mild Steel Binding Wire (Roll)", "Steel", 32.0, 90, "SUPP-003"),
        ("PROD-008", "Fiber-Cement Corrugated Roofing Sheet 2.4m", "Roofing", 11.5, 300, "SUPP-004"),
        ("PROD-009", "Long-Span Aluminium Step-Tile 0.55mm", "Roofing", 4.8, 1800, "SUPP-004"),
        ("PROD-010", "Polished Porcelain Floor Tiles 60x60 (Ctn)", "Flooring", 13.5, 450, "SUPP-006"),
        ("PROD-011", "Glazed Ceramic Wall Tiles 30x60 (Ctn)", "Flooring", 9.5, 400, "SUPP-006"),
        ("PROD-012", "Commercial Dual-Flush Sanitary Set", "Sanitary", 78.0, 60, "SUPP-006"),
        ("PROD-013", "2.5mm Single Core Copper Cable (100m)", "Electrical", 42.0, 120, "SUPP-005"),
        ("PROD-014", "4.0mm Single Core Copper Cable (100m)", "Electrical", 68.0, 85, "SUPP-005"),
        ("PROD-015", "Heavy Duty PVC Pressure Pipe 4-inch (Length)", "Plumbing", 12.0, 220, "SUPP-005"),
        ("PROD-016", "Crushed Granite Aggregate 3/4-inch (20-Tonne Tipper)", "Aggregate", 380.0, 30, "SUPP-002"),
    ]

    with open(os.path.join(DATA_DIR, "products.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "name", "category", "unit_price", "stock_quantity", "supplier_id"])
        writer.writerows(products)

    # 4. ORDERS, INVOICES, PAYMENTS, DISPUTES
    orders = []
    invoices = []
    payments = []
    disputes = []

    order_idx = 1
    inv_idx = 1
    pmt_idx = 1
    disp_idx = 1

    ref_date = datetime(2026, 10, 17)

    # Calibration in universal currency ($)
    customer_plans = {
        "CUST-001": [ # BrightMart Hardware
            ("2026-01-15", 18000, "PAID", ["PROD-001", "PROD-004"], 30, True, 18000, None),
            ("2026-04-10", 22000, "PAID", ["PROD-002", "PROD-005"], 30, True, 22000, None),
            ("2026-08-15", 12000, "OVERDUE", ["PROD-001", "PROD-007"], 30, False, 0, ("Damaged cement bags during stormy delivery transit", "MEDIUM")),
            ("2026-09-25", 15000, "PENDING", ["PROD-010", "PROD-013"], 30, False, 0, None),
        ],
        "CUST-002": [ # Metro Commercial Ventures (Shares contact with CUST-001)
            ("2026-03-01", 14000, "PAID", ["PROD-001", "PROD-004"], 30, True, 14000, None),
            ("2026-07-10", 28000, "PARTIALLY_PAID", ["PROD-004", "PROD-005"], 30, True, 8000, None),
            ("2026-08-08", 31000, "OVERDUE", ["PROD-002", "PROD-016"], 30, False, 0, None),
            ("2026-09-02", 19000, "OVERDUE", ["PROD-005", "PROD-014"], 30, False, 0, None),
        ],
        "CUST-003": [ # Apex Global Builders
            ("2026-02-10", 55000, "PAID", ["PROD-004", "PROD-005"], 30, True, 55000, None),
            ("2026-05-15", 62000, "PAID", ["PROD-002", "PROD-016"], 30, True, 62000, None),
            ("2026-08-20", 48000, "PENDING", ["PROD-008", "PROD-009"], 45, False, 0, None),
        ],
        "CUST-004": [ # Horizon Aggregate (Shares email with CUST-003)
            ("2026-03-12", 15000, "PAID", ["PROD-016"], 30, True, 15000, None),
            ("2026-07-01", 21000, "OVERDUE", ["PROD-004", "PROD-006"], 30, False, 0, ("Substandard rebar tensile strength report", "HIGH")),
            ("2026-08-22", 18000, "OVERDUE", ["PROD-016"], 30, False, 0, None),
        ],
        "CUST-005": [ # Frontier InfraTech
            ("2026-01-20", 35000, "PAID", ["PROD-013", "PROD-014"], 30, True, 35000, None),
            ("2026-04-18", 42000, "PAID", ["PROD-004", "PROD-015"], 30, True, 42000, None),
            ("2026-07-22", 38000, "PAID", ["PROD-001", "PROD-002"], 30, True, 38000, None),
        ],
        "CUST-006": [ # Crestline Heights (Shares phone with CUST-005)
            ("2026-04-05", 26000, "PAID", ["PROD-010", "PROD-012"], 30, True, 26000, None),
            ("2026-07-15", 34000, "OVERDUE", ["PROD-005", "PROD-008"], 30, False, 0, None),
            ("2026-09-01", 29000, "OVERDUE", ["PROD-010", "PROD-011"], 30, False, 0, None),
        ],
        "CUST-007": [ # Valley Mechanics
            ("2026-02-18", 24000, "PAID", ["PROD-004", "PROD-007"], 30, True, 24000, None),
            ("2026-06-12", 21000, "PAID", ["PROD-006", "PROD-007"], 30, True, 21000, None),
            ("2026-09-10", 18000, "PENDING", ["PROD-004", "PROD-005"], 30, False, 0, None),
        ],
        "CUST-008": [ # Summit Hardware (Shares address with CUST-007)
            ("2026-05-10", 12000, "PAID", ["PROD-001", "PROD-006"], 30, True, 12000, None),
            ("2026-08-01", 18000, "OVERDUE", ["PROD-007", "PROD-015"], 30, False, 0, ("Delayed warehouse offloading demurrage claimed", "LOW")),
            ("2026-09-05", 14000, "OVERDUE", ["PROD-001"], 30, False, 0, None),
        ],
        "CUST-009": [ # Pioneer Builders
            ("2026-03-10", 14000, "PAID", ["PROD-001", "PROD-008"], 30, True, 14000, None),
            ("2026-06-15", 16000, "PAID", ["PROD-001", "PROD-008"], 30, True, 16000, None),
            ("2026-08-10", 22000, "OVERDUE", ["PROD-002", "PROD-009"], 30, False, 0, ("Freight demurrage dispute", "MEDIUM")),
            ("2026-09-14", 18000, "PENDING", ["PROD-003", "PROD-007"], 30, False, 0, None),
        ],
        "CUST-010": [ # FastTrack Construction (Shares email with CUST-009)
            ("2026-01-18", 22000, "PAID", ["PROD-004", "PROD-005"], 30, True, 22000, None),
            ("2026-03-20", 29000, "PAID", ["PROD-004", "PROD-005"], 30, True, 29000, None),
            ("2026-07-25", 24000, "OVERDUE", ["PROD-001", "PROD-016"], 30, False, 0, ("Batch weight discrepancies on cement load", "MEDIUM")),
            ("2026-09-08", 31000, "OVERDUE", ["PROD-010", "PROD-014"], 30, False, 0, None),
        ],
        "CUST-011": [ # Prime Continental (VIP Luxury Developer)
            ("2026-01-10", 65000, "PAID", ["PROD-002", "PROD-005"], 30, True, 65000, None),
            ("2026-03-15", 72000, "PAID", ["PROD-010", "PROD-012"], 30, True, 72000, None),
            ("2026-05-20", 58000, "PAID", ["PROD-004", "PROD-016"], 30, True, 58000, None),
            ("2026-07-18", 81000, "PAID", ["PROD-008", "PROD-013"], 30, True, 81000, None),
            ("2026-08-25", 42000, "PAID", ["PROD-004", "PROD-005"], 30, True, 42000, None),
            ("2026-09-12", 45000, "PENDING", ["PROD-010", "PROD-011"], 45, True, 45000, None), # advance settlement
        ],
        "CUST-012": [ # Continental Block Works (Prompt Manufacturer)
            ("2026-02-05", 21000, "PAID", ["PROD-001", "PROD-016"], 30, True, 21000, None),
            ("2026-04-12", 23000, "PAID", ["PROD-002", "PROD-016"], 30, True, 23000, None),
            ("2026-06-20", 25000, "PAID", ["PROD-001", "PROD-016"], 30, True, 25000, None),
            ("2026-08-25", 22000, "PAID", ["PROD-002", "PROD-016"], 30, True, 22000, None),
            ("2026-09-28", 24000, "PENDING", ["PROD-001", "PROD-016"], 30, False, 0, None),
        ],
        "CUST-013": [ # Modern Luxury Interiors
            ("2026-01-20", 18000, "PAID", ["PROD-010", "PROD-011"], 30, True, 18000, None),
            ("2026-03-18", 19000, "PAID", ["PROD-010", "PROD-011"], 30, True, 19000, None),
            ("2026-06-22", 24000, "PAID", ["PROD-012", "PROD-013"], 30, True, 24000, None),
            ("2026-09-15", 17000, "PENDING", ["PROD-010", "PROD-012"], 30, False, 0, None),
        ],
        "CUST-014": [ # Central Materials Depot
            ("2026-02-14", 11000, "PAID", ["PROD-001", "PROD-006"], 30, True, 11000, None),
            ("2026-04-15", 13000, "PAID", ["PROD-001", "PROD-006"], 30, True, 13000, None),
            ("2026-07-20", 16000, "OVERDUE", ["PROD-002", "PROD-007"], 30, False, 0, ("Damaged PVC pipes in transit", "MEDIUM")),
            ("2026-09-10", 14000, "PENDING", ["PROD-003", "PROD-015"], 30, False, 0, None),
        ],
        "CUST-015": [ # Metro Modern Homes
            ("2026-01-25", 31000, "PAID", ["PROD-004", "PROD-008"], 30, True, 31000, None),
            ("2026-03-20", 27000, "PAID", ["PROD-002", "PROD-004"], 30, True, 27000, None),
            ("2026-05-10", 35000, "PAID", ["PROD-005", "PROD-009"], 30, True, 35000, None),
            ("2026-08-30", 28000, "PENDING", ["PROD-001", "PROD-015"], 30, False, 0, None),
        ],
        "CUST-016": [ # Pacific Prime Developments
            ("2026-02-12", 68000, "PAID", ["PROD-004", "PROD-005"], 30, True, 68000, None),
            ("2026-06-05", 74000, "PAID", ["PROD-002", "PROD-010"], 30, True, 74000, None),
            ("2026-08-15", 61000, "PAID", ["PROD-005", "PROD-016"], 30, True, 61000, None),
            ("2026-09-20", 52000, "PENDING", ["PROD-008", "PROD-014"], 45, False, 0, None),
        ],
        "CUST-017": [ # Civil Infrastructure Contractors
            ("2026-01-15", 48000, "PAID", ["PROD-004", "PROD-005"], 30, True, 48000, None),
            ("2026-03-05", 51000, "PAID", ["PROD-004", "PROD-016"], 30, True, 51000, None),
            ("2026-05-22", 54000, "PAID", ["PROD-005", "PROD-015"], 30, True, 54000, None),
            ("2026-07-02", 59000, "PAID", ["PROD-005", "PROD-015"], 30, True, 59000, None),
            ("2026-09-12", 42000, "PENDING", ["PROD-002", "PROD-006"], 30, False, 0, None),
        ],
        "CUST-018": [ # Capital Ceramics
            ("2026-01-10", 19000, "PAID", ["PROD-010", "PROD-011"], 30, True, 19000, None),
            ("2026-03-25", 22000, "PAID", ["PROD-010", "PROD-011"], 30, True, 22000, None),
            ("2026-07-12", 27000, "PAID", ["PROD-010", "PROD-012"], 30, True, 27000, ("Chipped corner tiles during transit", "LOW")),
            ("2026-09-18", 21000, "PENDING", ["PROD-011", "PROD-013"], 30, False, 0, None),
        ],
        "CUST-019": [ # Delta Timber & Concrete
            ("2026-02-20", 15000, "PAID", ["PROD-001", "PROD-008"], 30, True, 15000, None),
            ("2026-05-15", 17000, "PAID", ["PROD-001", "PROD-008"], 30, True, 17000, None),
            ("2026-08-05", 21000, "OVERDUE", ["PROD-008", "PROD-009"], 30, False, 0, ("Mismatched roofing profile delivered", "HIGH")),
            ("2026-09-20", 16000, "PENDING", ["PROD-001", "PROD-006"], 30, False, 0, None),
        ],
        "CUST-020": [ # Alliance Civil Works
            ("2026-01-28", 29000, "PAID", ["PROD-004", "PROD-015"], 30, True, 29000, None),
            ("2026-04-10", 32000, "PAID", ["PROD-004", "PROD-015"], 30, True, 32000, None),
            ("2026-07-28", 36000, "PAID", ["PROD-005", "PROD-016"], 30, True, 36000, ("Short delivery by 2 tonnes on aggregate tipper", "MEDIUM")),
            ("2026-09-22", 27000, "PENDING", ["PROD-006", "PROD-015"], 30, False, 0, None),
        ],
    }

    # Generate records
    for cust_id, plan_list in customer_plans.items():
        for order_date_str, amount, planned_status, prod_ids, term_days, has_pmt, pmt_amount, dispute_info in plan_list:
            order_id = f"ORD-{order_idx:03d}"
            order_date = datetime.strptime(order_date_str, "%Y-%m-%d")
            due_date = order_date + timedelta(days=term_days)
            due_date_str = due_date.strftime("%Y-%m-%d")

            if planned_status == "PAID":
                status = "PAID"
                days_overdue = 0
                order_status = "FULFILLED"
            elif planned_status == "PARTIALLY_PAID":
                status = "PARTIALLY_PAID"
                days_overdue = max(0, (ref_date - due_date).days)
                order_status = "FULFILLED"
            else:
                if due_date < ref_date:
                    status = "OVERDUE"
                    days_overdue = (ref_date - due_date).days
                    order_status = "FULFILLED"
                else:
                    status = "PENDING"
                    days_overdue = 0
                    order_status = "PROCESSING" if random.random() > 0.5 else "PENDING"

            orders.append([
                order_id,
                cust_id,
                order_date_str,
                amount,
                order_status,
                due_date_str,
                ";".join(prod_ids)
            ])

            inv_id = f"INV-{inv_idx:03d}"
            inv_number = f"INV-2026-{inv_idx:04d}"
            invoices.append([
                inv_id,
                order_id,
                cust_id,
                inv_number,
                amount,
                order_date_str,
                due_date_str,
                status,
                days_overdue
            ])

            if has_pmt and pmt_amount > 0:
                if pmt_amount >= 30000 and planned_status == "PAID":
                    p1 = int(pmt_amount * 0.5)
                    p2 = pmt_amount - p1
                    d1 = (order_date + timedelta(days=5)).strftime("%Y-%m-%d")
                    d2 = (order_date + timedelta(days=22)).strftime("%Y-%m-%d")
                    payments.append([f"PMT-{pmt_idx:03d}", inv_id, p1, d1, "Direct Wire Transfer", "SETTLED"])
                    pmt_idx += 1
                    payments.append([f"PMT-{pmt_idx:03d}", inv_id, p2, d2, "Commercial Settlement", "SETTLED"])
                    pmt_idx += 1
                else:
                    pmt_id = f"PMT-{pmt_idx:03d}"
                    pmt_date = (order_date + timedelta(days=random.randint(10, 25))).strftime("%Y-%m-%d")
                    method = random.choice(["Direct Wire Transfer", "Commercial Settlement", "Bank Draft / Clearing", "Merchant Card Clearing"])
                    payments.append([
                        pmt_id,
                        inv_id,
                        pmt_amount,
                        pmt_date,
                        method,
                        "SETTLED"
                    ])
                    pmt_idx += 1

            if dispute_info:
                reason, severity = dispute_info
                disp_id = f"DISP-{disp_idx:03d}"
                disp_date = (order_date + timedelta(days=random.randint(5, 15))).strftime("%Y-%m-%d")
                disp_status = "OPEN" if status in ("OVERDUE", "PARTIALLY_PAID") else "RESOLVED"
                disputes.append([
                    disp_id,
                    inv_id,
                    reason,
                    disp_date,
                    disp_status,
                    severity
                ])
                disp_idx += 1

            order_idx += 1
            inv_idx += 1

    with open(os.path.join(DATA_DIR, "orders.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "customer_id", "order_date", "total_amount", "status", "due_date", "product_ids"])
        writer.writerows(orders)

    with open(os.path.join(DATA_DIR, "invoices.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "order_id", "customer_id", "invoice_number", "amount", "issue_date", "due_date", "status", "days_overdue"])
        writer.writerows(invoices)

    with open(os.path.join(DATA_DIR, "payments.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "invoice_id", "amount", "payment_date", "method", "status"])
        writer.writerows(payments)

    with open(os.path.join(DATA_DIR, "disputes.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "invoice_id", "reason", "opened_date", "status", "severity"])
        writer.writerows(disputes)

    print(f"Generated:")
    print(f"  Customers: {len(customers)}")
    print(f"  Suppliers: {len(suppliers)}")
    print(f"  Products: {len(products)}")
    print(f"  Orders: {len(orders)}")
    print(f"  Invoices: {len(invoices)}")
    print(f"  Payments: {len(payments)}")
    print(f"  Disputes: {len(disputes)}")

if __name__ == "__main__":
    generate_datasets()
