export interface Branch {
  id: string;
  name: string;
  location: string;
}

export const mockBranches: Branch[] = [
  { id: "Trichy", name: "Trichy Branch", location: "Srirangam" },
  { id: "Chennai", name: "Chennai Branch", location: "Anna Nagar" },
  { id: "Coimbatore", name: "Coimbatore Branch", location: "RS Puram" },
  { id: "Madurai", name: "Madurai Branch", location: "K.K. Nagar" },
];
