
import centerConfig from '../config/centerConfig';

const domain = centerConfig.email.split('@')[1];

export const staffData = [
    { id: "EMP001", name: "Meena Srinivasan", role: "Admin", branch: "Trichy", contact: "9876543210", email: `meena.s@${domain}`, status: "Active" },
    { id: "EMP002", name: "Rajesh Kumar", role: "Teacher", branch: "Trichy", contact: "9876543211", email: `rajesh.k@${domain}`, status: "Active" },
    { id: "EMP003", name: "Anitha Das", role: "Teacher", branch: "Trichy", contact: "9876543212", email: `anitha.d@${domain}`, status: "Active" },
    { id: "EMP004", name: "Suresh Gupta", role: "Accountant", branch: "Chennai", contact: "9876543213", email: `suresh.g@${domain}`, status: "Active" },
    { id: "EMP005", name: "Priya Mohan", role: "Counselor", branch: "Trichy", contact: "9876543214", email: `priya.m@${domain}`, status: "Active" },
    { id: "EMP0agaw1", name: "Kavita Singh", role: "Teacher", branch: "Chennai", contact: "9876543215", email: `kavita.s@${domain}`, status: "Inactive" },
    { id: "EMP007", name: "Arun Pandian", role: "IT Support", branch: "Trichy", contact: "9876543216", email: `arun.p@${domain}`, status: "Active" },
];
