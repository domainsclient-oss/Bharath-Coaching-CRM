
'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../../../components/ui/card';
import { studentService } from '../../../../services/firestoreService';
import { useBranchData } from '../../../../context/BranchContext';
import type { Student } from '../../../../models/student';
import { toast } from '../../../../components/ui/use-toast';
import { Printer, Loader2 } from 'lucide-react';
import centerConfig from '../../../../config/centerConfig';

interface FeeDetails {
    id: string;
    name: string;
    totalFees: number;
    paidAmount: number;
    balance: number;
    lastPaymentDate?: string;
}

// Mock fee details - replace with actual fee data fetching
const getMockFeeDetails = (student: Student): FeeDetails => ({
    id: student.id,
    name: student.name,
    totalFees: 50000, // Example value
    paidAmount: 25000, // Example value
    balance: 25000,   // Example value
    lastPaymentDate: '2024-07-15',
});

export default function FeeSearchPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [student, setStudent] = useState<Student | null>(null);
    const [feeDetails, setFeeDetails] = useState<FeeDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { branchId } = useBranchData();

    const handleSearch = async () => {
        if (!searchTerm.trim() || !branchId) return;
        setIsLoading(true);
        setStudent(null);
        setFeeDetails(null);
        try {
            // Assuming search by student ID for simplicity
            const results = await studentService.query([
                { field: 'studentId', operator: '==', value: searchTerm.trim() },
                { field: 'branchId', operator: '==', value: branchId },
            ]);

            if (results.length > 0) {
                const foundStudent = results[0] as Student;
                setStudent(foundStudent);
                // In a real app, you would fetch fee data related to this student
                setFeeDetails(getMockFeeDetails(foundStudent));
            } else {
                toast({ title: "Not Found", description: "No student found with that ID in this branch." });
            }
        } catch (error) {
            console.error("Search failed:", error);
            toast({ title: "Error", description: "An error occurred during the search.", variant: "destructive" });
        }
        setIsLoading(false);
    };

    const handlePrintReceipt = () => {
        window.print(); // Simple print function
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Fee Payment & Receipt</h1>

            <Card className="max-w-xl mx-auto mb-8">
                <CardHeader>
                    <CardTitle>Search Student</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Enter Student ID or Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {feeDetails && student && (
                <Card id="receipt-card" className="max-w-2xl mx-auto print-area">
                    <CardHeader className="text-center bg-gray-50 rounded-t-lg py-6">
                        <h1 className="text-2xl font-bold">{centerConfig.centerName}</h1>
                        <p className="text-sm text-gray-500">Fee Receipt</p>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><span className="font-semibold">Student Name:</span> {student.name}</div>
                            <div><span className="font-semibold">Student ID:</span> {student.studentId}</div>
                            <div><span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}</div>
                            <div><span className="font-semibold">Receipt No:</span> #{Date.now()}</div>
                        </div>
                        <div className="border-t pt-4 mt-4">
                             <div className="grid grid-cols-3 font-semibold mb-2">
                                <div>Description</div>
                                <div className="text-right">Amount</div>
                                <div className="text-right">Balance</div>
                            </div>
                             <div className="grid grid-cols-3">
                                <div>Tuition Fees</div>
                                <div className="text-right">₹{feeDetails.paidAmount.toLocaleString()}</div>
                                <div className="text-right">₹{feeDetails.balance.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="border-t pt-4 mt-4 text-right">
                            <div className="text-lg font-bold">Total Paid: ₹{feeDetails.paidAmount.toLocaleString()}</div>
                            <div className="text-md text-gray-600">Remaining Balance: ₹{feeDetails.balance.toLocaleString()}</div>
                        </div>
                         <div className="mt-8 text-center text-xs text-gray-500">
                            <p>{centerConfig.address}</p>
                            <p>Contact: {centerConfig.phone} | {centerConfig.email}</p>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end p-6 print-hide">
                        <Button onClick={handlePrintReceipt}><Printer className="mr-2 h-4 w-4"/> Print Receipt</Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
