
import {
    studentService,
    feeService,
    examService,
    studentHomeworkService,
    timetableService
} from './firestoreService';

const getStudentDashboardData = async (studentId: string, branchId: string) => {
    // 1. Student Profile
    const student = await studentService.getById(studentId);

    // 2. Attendance
    // This will require a more complex query on the attendance collection
    const attendancePercentage = 95; // Placeholder

    // 3. Fees Due
    const feeData = await feeService.query([
        { field: 'studentId', operator: '==', value: studentId },
        { field: 'status', operator: 'in', value: ['Unpaid', 'Partially Paid'] }
    ]);
    const feesDue = feeData.reduce((acc, fee) => acc + fee.balance, 0);
    const feesDueDate = feeData.length > 0 ? feeData[0].dueDate.toDate().toLocaleDateString('en-IN') : 'N/A';

    // 4. Upcoming Tests
    const upcomingTests = await examService.query([
        { field: 'class', operator: '==', value: student?.class },
        { field: 'date', operator: '>=', value: new Date() }
    ], { field: 'date', direction: 'asc' }, 5);

    // 5. Recent Homework
    const recentHomework = await studentHomeworkService.query([
        { field: 'studentId', operator: '==', value: studentId }
    ], { field: 'dueDate', direction: 'desc' }, 5);

    // 6. Today's Schedule
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayClasses = await timetableService.query([
        { field: 'class', operator: '==', value: student?.class },
        { field: 'day', operator: '==', value: today }
    ]);

    return {
        name: student?.name,
        photoUrl: student?.photoUrl,
        attendancePercentage,
        feesDue,
        feesDueDate,
        upcomingTests,
        recentHomework,
        todayClasses
    };
};

export const studentDashboardService = {
    getStudentDashboardData
};