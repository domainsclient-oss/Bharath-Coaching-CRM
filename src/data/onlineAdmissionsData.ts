
export interface OnlineAdmission {
  id: string;
  appNo: string;
  name: string;
  class: string;
  board: string;
  phone: string;
  email: string;
  submittedDate: string;
  status: "New" | "Contacted" | "Admitted" | "Rejected";
  source: string;
}

export const mockOnlineAdmissions: OnlineAdmission[] = [
  {
    id: "OA001",
    appNo: "WEB-2025-001",
    name: "Rahul Sharma",
    class: "10",
    board: "CBSE",
    phone: "9887766554",
    email: "rahul.s@gmail.com",
    submittedDate: "2025-03-12",
    status: "New",
    source: "Website"
  },
  {
    id: "OA002",
    appNo: "WEB-2025-002",
    name: "Priya Das",
    class: "9",
    board: "ICSE",
    phone: "9887766555",
    email: "priya.d@yahoo.com",
    submittedDate: "2025-03-11",
    status: "Contacted",
    source: "Website"
  },
  {
    id: "OA003",
    appNo: "WEB-2025-003",
    name: "Karthik R",
    class: "12",
    board: "State",
    phone: "9887766556",
    email: "karthik.r@outlook.com",
    submittedDate: "2025-03-10",
    status: "Admitted",
    source: "Website"
  },
  {
    id: "OA004",
    appNo: "WEB-2025-004",
    name: "Anjali Singh",
    class: "11",
    board: "CBSE",
    phone: "9887766557",
    email: "anjali.s@gmail.com",
    submittedDate: "2025-03-09",
    status: "Rejected",
    source: "Website"
  },
  {
    id: "OA005",
    appNo: "WEB-2025-005",
    name: "Suresh Kumar",
    class: "10",
    board: "CBSE",
    phone: "9887766558",
    email: "suresh.k@gmail.com",
    submittedDate: "2025-03-08",
    status: "New",
    source: "Website"
  },
  {
    id: "OA006",
    appNo: "WEB-2025-006",
    name: "Meenakshi V",
    class: "12",
    board: "State",
    phone: "9887766559",
    email: "meena.v@gmail.com",
    submittedDate: "2025-03-07",
    status: "Contacted",
    source: "Website"
  },
  {
    id: "OA007",
    appNo: "WEB-2025-007",
    name: "Arjun Mehta",
    class: "9",
    board: "CBSE",
    phone: "9887766560",
    email: "arjun.m@gmail.com",
    submittedDate: "2025-03-06",
    status: "New",
    source: "Website"
  },
  {
    id: "OA008",
    appNo: "WEB-2025-008",
    name: "Sneha Patil",
    class: "11",
    board: "State",
    phone: "9887766561",
    email: "sneha.p@gmail.com",
    submittedDate: "2025-03-05",
    status: "New",
    source: "Website"
  }
];
