// libraryData.ts

export type BookCategory =
  | "Science"
  | "Mathematics"
  | "Literature"
  | "History"
  | "Computer Science"
  | "Reference"
  | "Language"
  | "Arts";

export type IssueStatus = "Issued" | "Returned" | "Overdue";

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  publisher: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  branchId: string;
}

export interface BookIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  memberId: string;
  memberName: string;
  memberType: "Student" | "Staff";
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: IssueStatus;
  fineAmount?: number;
  branchId: string;
}

// ── Books ─────────────────────────────────────────────────────────────────────
export const mockBooks: Book[] = [
  { id: "BK001", title: "NCERT Mathematics Class 10",      author: "NCERT",             isbn: "978-81-7450-001-1", category: "Mathematics",      publisher: "NCERT",           publishedYear: 2022, totalCopies: 10, availableCopies: 6,  shelfLocation: "A-01", branchId: "Trichy" },
  { id: "BK002", title: "NCERT Physics Part I Class 12",   author: "NCERT",             isbn: "978-81-7450-002-8", category: "Science",          publisher: "NCERT",           publishedYear: 2022, totalCopies: 8,  availableCopies: 5,  shelfLocation: "A-02", branchId: "Trichy" },
  { id: "BK003", title: "NCERT Chemistry Class 11",        author: "NCERT",             isbn: "978-81-7450-003-5", category: "Science",          publisher: "NCERT",           publishedYear: 2021, totalCopies: 8,  availableCopies: 8,  shelfLocation: "A-03", branchId: "Trichy" },
  { id: "BK004", title: "NCERT Biology Class 12",          author: "NCERT",             isbn: "978-81-7450-004-2", category: "Science",          publisher: "NCERT",           publishedYear: 2022, totalCopies: 7,  availableCopies: 4,  shelfLocation: "A-04", branchId: "Trichy" },
  { id: "BK005", title: "Wings of Fire",                   author: "A.P.J. Abdul Kalam",isbn: "978-81-7371-490-7", category: "Literature",       publisher: "Universities Press",publishedYear: 1999, totalCopies: 5,  availableCopies: 3,  shelfLocation: "B-01", branchId: "Trichy" },
  { id: "BK006", title: "The Discovery of India",          author: "Jawaharlal Nehru",  isbn: "978-01-4303-528-2", category: "History",          publisher: "Penguin",         publishedYear: 2004, totalCopies: 4,  availableCopies: 4,  shelfLocation: "B-02", branchId: "Trichy" },
  { id: "BK007", title: "Introduction to Algorithms",      author: "Cormen et al.",     isbn: "978-02-6203-384-8", category: "Computer Science", publisher: "MIT Press",       publishedYear: 2009, totalCopies: 3,  availableCopies: 1,  shelfLocation: "C-01", branchId: "Trichy" },
  { id: "BK008", title: "Python for Beginners",            author: "John Doe",          isbn: "978-00-0000-001-2", category: "Computer Science", publisher: "Tech Books",      publishedYear: 2021, totalCopies: 5,  availableCopies: 2,  shelfLocation: "C-02", branchId: "Trichy" },
  { id: "BK009", title: "Oxford English Grammar",          author: "Sidney Greenbaum",  isbn: "978-01-9431-351-5", category: "Language",         publisher: "Oxford",          publishedYear: 1996, totalCopies: 6,  availableCopies: 5,  shelfLocation: "D-01", branchId: "Trichy" },
  { id: "BK010", title: "Tamil Nadu History & Culture",    author: "K. Rajayyan",       isbn: "978-81-7091-001-3", category: "History",          publisher: "Ennes Publications",publishedYear: 2015, totalCopies: 4, availableCopies: 4,  shelfLocation: "B-03", branchId: "Trichy" },
  { id: "BK011", title: "Wren & Martin English Grammar",   author: "Wren & Martin",     isbn: "978-81-2190-199-8", category: "Language",         publisher: "S Chand",         publishedYear: 2018, totalCopies: 8,  availableCopies: 6,  shelfLocation: "D-02", branchId: "Trichy" },
  { id: "BK012", title: "Fundamentals of Physics",         author: "Halliday & Resnick",isbn: "978-04-7046-901-8", category: "Science",          publisher: "Wiley",           publishedYear: 2013, totalCopies: 4,  availableCopies: 0,  shelfLocation: "A-05", branchId: "Trichy" },
  { id: "BK013", title: "Visual Arts — Theory & Practice", author: "Pramod Kumar",      isbn: "978-81-5001-001-9", category: "Arts",             publisher: "Art India Press", publishedYear: 2019, totalCopies: 3,  availableCopies: 3,  shelfLocation: "E-01", branchId: "Trichy" },
  { id: "BK014", title: "Concise Oxford Dictionary",       author: "Oxford",            isbn: "978-01-9860-515-3", category: "Reference",        publisher: "Oxford",          publishedYear: 2011, totalCopies: 2,  availableCopies: 2,  shelfLocation: "D-03", branchId: "Trichy" },
  { id: "BK015", title: "Higher Algebra",                  author: "Hall & Knight",     isbn: "978-81-2190-002-1", category: "Mathematics",      publisher: "S Chand",         publishedYear: 2017, totalCopies: 5,  availableCopies: 5,  shelfLocation: "A-06", branchId: "Trichy" },
];

// ── Issue Records ─────────────────────────────────────────────────────────────
export const mockBookIssues: BookIssue[] = [
  { id: "ISS001", bookId: "BK001", bookTitle: "NCERT Mathematics Class 10",    bookIsbn: "978-81-7450-001-1", memberId: "STU001", memberName: "Arjun Krishnan",   memberType: "Student", issueDate: "2026-03-20", dueDate: "2026-04-03", returnDate: "2026-04-01", status: "Returned",  branchId: "Trichy" },
  { id: "ISS002", bookId: "BK002", bookTitle: "NCERT Physics Part I Class 12", bookIsbn: "978-81-7450-002-8", memberId: "STU002", memberName: "Priya Menon",      memberType: "Student", issueDate: "2026-03-25", dueDate: "2026-04-08", returnDate: undefined,    status: "Issued",    branchId: "Trichy" },
  { id: "ISS003", bookId: "BK004", bookTitle: "NCERT Biology Class 12",        bookIsbn: "978-81-7450-004-2", memberId: "STU003", memberName: "Rahul Sharma",     memberType: "Student", issueDate: "2026-03-22", dueDate: "2026-04-05", returnDate: undefined,    status: "Overdue",   fineAmount: 20, branchId: "Trichy" },
  { id: "ISS004", bookId: "BK007", bookTitle: "Introduction to Algorithms",    bookIsbn: "978-02-6203-384-8", memberId: "EMP008", memberName: "Divya Nair",       memberType: "Staff",   issueDate: "2026-04-01", dueDate: "2026-04-15", returnDate: undefined,    status: "Issued",    branchId: "Trichy" },
  { id: "ISS005", bookId: "BK005", bookTitle: "Wings of Fire",                  bookIsbn: "978-81-7371-490-7", memberId: "STU004", memberName: "Kavya Rajan",      memberType: "Student", issueDate: "2026-04-02", dueDate: "2026-04-16", returnDate: "2026-04-10", status: "Returned",  branchId: "Trichy" },
  { id: "ISS006", bookId: "BK008", bookTitle: "Python for Beginners",           bookIsbn: "978-00-0000-001-2", memberId: "STU005", memberName: "Nisha Menon",      memberType: "Student", issueDate: "2026-03-15", dueDate: "2026-03-29", returnDate: undefined,    status: "Overdue",   fineAmount: 60, branchId: "Trichy" },
  { id: "ISS007", bookId: "BK001", bookTitle: "NCERT Mathematics Class 10",    bookIsbn: "978-81-7450-001-1", memberId: "STU006", memberName: "Deepak Kumar",     memberType: "Student", issueDate: "2026-04-05", dueDate: "2026-04-19", returnDate: undefined,    status: "Issued",    branchId: "Trichy" },
  { id: "ISS008", bookId: "BK012", bookTitle: "Fundamentals of Physics",        bookIsbn: "978-04-7046-901-8", memberId: "EMP002", memberName: "Arun Patel",       memberType: "Staff",   issueDate: "2026-04-01", dueDate: "2026-04-22", returnDate: undefined,    status: "Issued",    branchId: "Trichy" },
  { id: "ISS009", bookId: "BK012", bookTitle: "Fundamentals of Physics",        bookIsbn: "978-04-7046-901-8", memberId: "STU007", memberName: "Meena Sundaram",   memberType: "Student", issueDate: "2026-03-18", dueDate: "2026-04-01", returnDate: undefined,    status: "Overdue",   fineAmount: 40, branchId: "Trichy" },
  { id: "ISS010", bookId: "BK011", bookTitle: "Wren & Martin English Grammar",  bookIsbn: "978-81-2190-199-8", memberId: "STU008", memberName: "Kiran Raj",        memberType: "Student", issueDate: "2026-04-08", dueDate: "2026-04-22", returnDate: undefined,    status: "Issued",    branchId: "Trichy" },
];

export const BOOK_CATEGORIES: BookCategory[] = [
  "Science", "Mathematics", "Literature", "History",
  "Computer Science", "Reference", "Language", "Arts",
];
