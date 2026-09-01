
export type ItemCategory = "Stationery" | "Furniture" | "IT Equipment" | "Sports" | "Lab Equipment" | "Books" | "Other";

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  unit: string; // e.g. "Nos", "Reams", "Boxes"
  totalStock: number;
  issuedStock: number;
  availableStock: number;
  minStockLevel: number; // alert threshold
  lastRestockedDate: string;
  branchId: string;
}

export interface StockEntry {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  purchaseDate: string;
  supplier?: string;
  costPerUnit?: number;
  invoiceNo?: string;
  addedBy: string;
  branchId: string;
}

export interface IssueRecord {
  id: string;
  itemId: string;
  itemName: string;
  issuedTo: string;       // Name of recipient
  recipientType: "Student" | "Staff" | "Department";
  recipientId?: string;
  quantity: number;
  issueDate: string;
  expectedReturnDate?: string;
  returnDate?: string;
  status: "Issued" | "Returned" | "Lost";
  issuedBy: string;
  branchId: string;
  remarks?: string;
}

export const mockInventoryItems: InventoryItem[] = [
  { id: "INV001", name: "A4 Paper Reams", category: "Stationery", unit: "Reams", totalStock: 50, issuedStock: 12, availableStock: 38, minStockLevel: 10, lastRestockedDate: "2026-03-01", branchId: "Trichy" },
  { id: "INV002", name: "Whiteboard Markers", category: "Stationery", unit: "Box", totalStock: 30, issuedStock: 18, availableStock: 12, minStockLevel: 5, lastRestockedDate: "2026-02-15", branchId: "Trichy" },
  { id: "INV003", name: "Student Chairs", category: "Furniture", unit: "Nos", totalStock: 120, issuedStock: 100, availableStock: 20, minStockLevel: 10, lastRestockedDate: "2025-09-10", branchId: "Trichy" },
  { id: "INV004", name: "Laptops", category: "IT Equipment", unit: "Nos", totalStock: 15, issuedStock: 12, availableStock: 3, minStockLevel: 2, lastRestockedDate: "2025-12-05", branchId: "Trichy" },
  { id: "INV005", name: "Projectors", category: "IT Equipment", unit: "Nos", totalStock: 6, issuedStock: 5, availableStock: 1, minStockLevel: 1, lastRestockedDate: "2025-11-20", branchId: "Trichy" },
  { id: "INV006", name: "Pens (Blue)", category: "Stationery", unit: "Box", totalStock: 80, issuedStock: 45, availableStock: 35, minStockLevel: 20, lastRestockedDate: "2026-03-10", branchId: "Trichy" },
  { id: "INV007", name: "Scientific Calculators", category: "Lab Equipment", unit: "Nos", totalStock: 40, issuedStock: 35, availableStock: 5, minStockLevel: 5, lastRestockedDate: "2026-01-08", branchId: "Trichy" },
  { id: "INV008", name: "Physics Lab Kit", category: "Lab Equipment", unit: "Set", totalStock: 10, issuedStock: 8, availableStock: 2, minStockLevel: 2, lastRestockedDate: "2025-08-15", branchId: "Trichy" },
  { id: "INV009", name: "Reference Books (Math)", category: "Books", unit: "Nos", totalStock: 60, issuedStock: 40, availableStock: 20, minStockLevel: 10, lastRestockedDate: "2026-02-01", branchId: "Trichy" },
  { id: "INV010", name: "Badminton Rackets", category: "Sports", unit: "Nos", totalStock: 12, issuedStock: 8, availableStock: 4, minStockLevel: 2, lastRestockedDate: "2025-10-10", branchId: "Trichy" },
];

export const mockStockEntries: StockEntry[] = [
  { id: "SE001", itemId: "INV001", itemName: "A4 Paper Reams", quantity: 20, purchaseDate: "2026-03-01", supplier: "Raja Stationery", costPerUnit: 450, invoiceNo: "INV-2026-0091", addedBy: "Admin", branchId: "Trichy" },
  { id: "SE002", itemId: "INV006", itemName: "Pens (Blue)", quantity: 30, purchaseDate: "2026-03-10", supplier: "Classmate Wholesale", costPerUnit: 120, invoiceNo: "INV-2026-0105", addedBy: "Admin", branchId: "Trichy" },
  { id: "SE003", itemId: "INV004", itemName: "Laptops", quantity: 5, purchaseDate: "2025-12-05", supplier: "Dell India", costPerUnit: 55000, invoiceNo: "DELL-2025-8821", addedBy: "Super Admin", branchId: "Trichy" },
  { id: "SE004", itemId: "INV009", itemName: "Reference Books (Math)", quantity: 25, purchaseDate: "2026-02-01", supplier: "Educational Books Pvt Ltd", costPerUnit: 350, invoiceNo: "EB-2026-0034", addedBy: "Admin", branchId: "Trichy" },
];

export const mockIssueRecords: IssueRecord[] = [
  { id: "IR001", itemId: "INV004", itemName: "Laptops", issuedTo: "Priya Sharma", recipientType: "Staff", recipientId: "STF001", quantity: 1, issueDate: "2026-01-10", expectedReturnDate: "2026-06-30", status: "Issued", issuedBy: "Admin", branchId: "Trichy" },
  { id: "IR002", itemId: "INV007", itemName: "Scientific Calculators", issuedTo: "Arjun Krishnan", recipientType: "Student", recipientId: "STU001", quantity: 1, issueDate: "2026-02-05", expectedReturnDate: "2026-05-31", status: "Issued", issuedBy: "Priya Sharma", branchId: "Trichy" },
  { id: "IR003", itemId: "INV007", itemName: "Scientific Calculators", issuedTo: "Meera Nair", recipientType: "Student", recipientId: "STU002", quantity: 1, issueDate: "2026-02-05", expectedReturnDate: "2026-05-31", status: "Returned", returnDate: "2026-03-20", issuedBy: "Priya Sharma", branchId: "Trichy" },
  { id: "IR004", itemId: "INV005", itemName: "Projectors", issuedTo: "Class 10 Room", recipientType: "Department", quantity: 1, issueDate: "2026-01-01", status: "Issued", issuedBy: "Admin", branchId: "Trichy" },
  { id: "IR005", itemId: "INV009", itemName: "Reference Books (Math)", issuedTo: "Rohan V", recipientType: "Student", recipientId: "STU003", quantity: 2, issueDate: "2026-03-01", expectedReturnDate: "2026-04-30", status: "Issued", issuedBy: "Admin", branchId: "Trichy", remarks: "For board exam prep" },
];

export interface ItemCategoryRecord {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  branchId: string;
}

export const mockItemCategories: ItemCategoryRecord[] = [
  { id: "CAT001", name: "Stationery",    description: "Pens, paper, markers, and office supplies",   itemCount: 3, branchId: "Trichy" },
  { id: "CAT002", name: "Furniture",     description: "Chairs, desks, tables, and storage units",    itemCount: 1, branchId: "Trichy" },
  { id: "CAT003", name: "IT Equipment",  description: "Laptops, projectors, printers, and gadgets",  itemCount: 2, branchId: "Trichy" },
  { id: "CAT004", name: "Sports",        description: "Sports equipment and outdoor activity gear",   itemCount: 1, branchId: "Trichy" },
  { id: "CAT005", name: "Lab Equipment", description: "Scientific instruments and lab kits",         itemCount: 2, branchId: "Trichy" },
  { id: "CAT006", name: "Books",         description: "Reference books, textbooks, and resources",   itemCount: 1, branchId: "Trichy" },
  { id: "CAT007", name: "Other",         description: "Miscellaneous items not in other categories", itemCount: 0, branchId: "Trichy" },
];

export const ITEM_CATEGORIES: ItemCategory[] = ["Stationery", "Furniture", "IT Equipment", "Sports", "Lab Equipment", "Books", "Other"];

export const CATEGORY_COLORS: Record<ItemCategory, string> = {
  "Stationery": "bg-blue-100 text-blue-700",
  "Furniture": "bg-amber-100 text-amber-700",
  "IT Equipment": "bg-purple-100 text-purple-700",
  "Sports": "bg-green-100 text-green-700",
  "Lab Equipment": "bg-teal-100 text-teal-700",
  "Books": "bg-orange-100 text-orange-700",
  "Other": "bg-slate-100 text-slate-700",
};
