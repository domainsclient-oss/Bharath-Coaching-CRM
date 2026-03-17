
"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Check, ChevronsUpDown, Search, CalendarIcon, Printer, UserPlus } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

import { useBranchData } from "@/hooks/use-branch-data";
import { mockStudents, Student } from "@/data/studentsData";
import { mockFeeRecords, FeeRecord, Instalment, PaymentMode } from "@/data/feesData";
import { cn } from "@/lib/utils";

const CollectFeePage = () => {
  const searchParams = useSearchParams();
  const studentIdFromQuery = searchParams.get('studentId');

  const { data: students } = useBranchData<Student>(mockStudents);
  const [open, setOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(studentIdFromQuery);

  const selectedStudent = useMemo(() => 
    students.find(s => s.id === selectedStudentId)
  , [students, selectedStudentId]);

  // Fee form state
  const [totalFee, setTotalFee] = useState(0);
  const [instalments, setInstalments] = useState<FeeRecord['instalments']>({});
  const [notes, setNotes] = useState("");
  const [billNo, setBillNo] = useState("");

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    setOpen(false);
    // Reset form when new student is selected
    setTotalFee(0);
    setInstalments({});
    setNotes("");
    setBillNo("");
  };

  const handleCollect = (instalmentKey: keyof FeeRecord['instalments']) => {
    const instalment = instalments[instalmentKey];
    if (!instalment) return;

    const updatedInstalments = {
        ...instalments,
        [instalmentKey]: { ...instalment, collected: true, date: new Date().toISOString().split('T')[0] }
    };
    setInstalments(updatedInstalments);
  }

  const calculateTotals = useMemo(() => {
      const collected = Object.values(instalments)
        .filter(i => i?.collected)
        .reduce((sum, i) => sum + (i?.amount || 0), 0);
      const balance = totalFee - collected;
      return { collected, balance };
  }, [totalFee, instalments]);

  const handleSaveFee = () => {
    if (!selectedStudent) return;

    const newBillNo = `BA-${new Date().getFullYear()}-${String(mockFeeRecords.length + 1).padStart(4, '0')}`;
    const newFeeRecord: FeeRecord = {
      id: `FEE${Date.now()}`,
      billNo: newBillNo,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      class: selectedStudent.class,
      board: selectedStudent.board,
      subjects: selectedStudent.subjects,
      feeType: "Standard", // or OneToOne based on some logic
      totalFee,
      instalments,
      collected: calculateTotals.collected,
      balance: calculateTotals.balance,
      nextPaymentDate: Object.values(instalments).find(i => !i?.collected)?.date,
      notes,
      branchId: selectedStudent.branchId as any,
    };

    // In a real app, this would be an API call
    mockFeeRecords.push(newFeeRecord);
    setBillNo(newBillNo);
  };
  
  const InstalmentInput = ({ iKey, label }: { iKey: keyof FeeRecord['instalments'], label: string }) => {
    const isCollected = instalments[iKey]?.collected ?? false;
    const isPreviousCollected = iKey === 'i1' || instalments[iKey === 'i2' ? 'i1' : 'i2']?.collected;

    return (
        <div className={cn("grid grid-cols-5 gap-2 items-center p-2 rounded-md", isCollected && "bg-green-50")}>
            <label className="font-medium">{label}</label>
            <Input
                type="number"
                placeholder="Amount"
                disabled={isCollected || !isPreviousCollected}
                value={instalments[iKey]?.amount || ''}
                onChange={(e) => setInstalments({...instalments, [iKey]: {...(instalments[iKey] || {}), amount: Number(e.target.value)} })}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} disabled={isCollected || !isPreviousCollected} className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {instalments[iKey]?.date ? new Date(instalments[iKey]!.date).toLocaleDateString() : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={instalments[iKey]?.date ? new Date(instalments[iKey]!.date) : undefined} onSelect={(d) => setInstalments({...instalments, [iKey]: {...(instalments[iKey] || {}), date: d?.toISOString().split('T')[0]}})} initialFocus />
              </PopoverContent>
            </Popover>
             <Select 
                disabled={isCollected || !isPreviousCollected}
                onValueChange={(v) => setInstalments({...instalments, [iKey]: {...(instalments[iKey] || {}), mode: v as PaymentMode}})}
                value={instalments[iKey]?.mode}
             >
              <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="NEFT">NEFT</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" disabled={isCollected || !instalments[iKey]?.amount} onClick={() => handleCollect(iKey)}>{isCollected ? 'Collected' : 'Collect'}</Button>
        </div>
    )
  }

  if (billNo) {
      return (
          <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <Check className="mx-auto h-16 w-16 text-green-500 bg-green-100 rounded-full p-2"/>
                  <CardTitle>Fee Collected Successfully!</CardTitle>
                  <CardDescription>Bill No: <span className="font-mono font-bold">{billNo}</span></CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                  <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4"/> Print Receipt</Button>
                  <Button variant="secondary" onClick={() => { setBillNo(""); setSelectedStudentId(null) }}>Collect Another Fee</Button>
              </CardContent>
          </Card>
      )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Find Student</CardTitle>
          <CardDescription>Search for the student by name or application number.</CardDescription>
        </CardHeader>
        <CardContent>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full md:w-[400px] justify-between">
                  {selectedStudent ? (
                    <>{selectedStudent.name} ({selectedStudent.appNo})</>
                  ) : (
                    "Select student..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full md:w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search student..." />
                  <CommandList>
                    <CommandEmpty>No student found.</CommandEmpty>
                    <CommandGroup>
                      {students.map((student) => (
                        <CommandItem key={student.id} value={student.name} onSelect={() => handleStudentSelect(student.id)}>
                          <Check className={cn("mr-2 h-4 w-4", selectedStudentId === student.id ? "opacity-100" : "opacity-0")}/>
                          {student.name} ({student.appNo})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
        </CardContent>
      </Card>

      {selectedStudent && (
          <Card>
              <CardHeader>
                  <CardTitle>Step 2: Fee Entry Form</CardTitle>
                  <div className="flex justify-between items-center">
                    <CardDescription>
                      Collecting fees for <span className="font-bold">{selectedStudent.name}</span>
                    </CardDescription>
                    <div className="text-sm text-muted-foreground font-mono">Bill No: {`BA-${new Date().getFullYear()}-XXXX`}</div>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <Input value={selectedStudent.name} disabled placeholder="Student Name" />
                    <Input value={selectedStudent.class} disabled placeholder="Class" />
                    <Input value={selectedStudent.board} disabled placeholder="Board" />
                </div>
                <Input value={selectedStudent.subjects.join(', ')} disabled placeholder="Subjects"/>
                <div className="border rounded-md p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                        <Input type="number" placeholder="Total Fee Amount" value={totalFee || ''} onChange={e => setTotalFee(Number(e.target.value))} />
                    </div>
                    
                    <InstalmentInput iKey="i1" label="Instalment I" />
                    <InstalmentInput iKey="i2" label="Instalment II" />
                    <InstalmentInput iKey="i3" label="Instalment III" />

                </div>

                <div className="flex justify-between items-center font-bold text-lg p-4 bg-muted rounded-md">
                    <span>Collected: <span className="text-green-600">{calculateTotals.collected.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span></span>
                    <span>Balance: <span className="text-red-600">{calculateTotals.balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span></span>
                </div>

                <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                
                <Button onClick={handleSaveFee} className="w-full">Save & Generate Receipt</Button>
              </CardContent>
          </Card>
      )}
    </div>
  );
};

export default CollectFeePage;
