
import { 
    studentService, 
    staffService, 
    feeService, 
    enquiryService 
} from './firestoreService';
import { startOfMonth, endOfMonth } from 'date-fns';

const getDashboardKPIs = async (branchId: string) => {
    // 1. Total Students
    const students = await studentService.query([
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'status', operator: '==', value: 'Active' }
    ]);
    const totalStudents = students.length;

    // 2. Active Staff
    const staff = await staffService.query([
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'status', operator: '==', value: 'Active' }
    ]);
    const activeStaff = staff.length;

    // 3. Fees Collected This Month
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const feesThisMonth = await feeService.query([
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'paymentDate', operator: '>=', value: start },
        { field: 'paymentDate', operator: '<=', value: end }
    ]);
    const feesCollectedThisMonth = feesThisMonth.reduce((acc, fee) => acc + fee.amountPaid, 0);

    // 4. Pending Dues
    const pendingFees = await feeService.query([
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'status', operator: 'in', value: ['Unpaid', 'Partially Paid'] }
    ]);
    const pendingDues = pendingFees.reduce((acc, fee) => acc + fee.balance, 0);

    return {
        totalStudents,
        activeStaff,
        feesCollectedThisMonth,
        pendingDues
    };
};

const getMonthlyFeeCollection = async (branchId: string) => {
    // Implementation for monthly fee collection chart
    // This will require a more complex query, likely involving multiple queries and data aggregation
    return [];
};

const getLeadSources = async (branchId: string) => {
    const enquiries = await enquiryService.query([
        { field: 'branchId', operator: '==', value: branchId }
    ]);

    const leadSources = enquiries.reduce((acc, enquiry) => {
        const source = enquiry.source || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    return Object.entries(leadSources).map(([name, value]) => ({ name, value }));
};

const getFeeAlerts = async (branchId: string) => {
    return await feeService.query([
        { field: 'branchId', operator: '==', value: branchId },
        { field: 'status', operator: 'in', value: ['Unpaid', 'Partially Paid'] },
        { field: 'dueDate', operator: '<=', value: new Date() }
    ], { field: 'dueDate', direction: 'asc' }, 5);
};

const getRecentEnquiries = async (branchId: string) => {
    return await enquiryService.query([
        { field: 'branchId', operator: '==', value: branchId }
    ], { field: 'createdAt', direction: 'desc' }, 5);
};

export const dashboardService = {
    getDashboardKPIs,
    getMonthlyFeeCollection,
    getLeadSources,
    getFeeAlerts,
    getRecentEnquiries
};