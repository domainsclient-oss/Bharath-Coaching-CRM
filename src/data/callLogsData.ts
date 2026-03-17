
import { BranchId } from '@/lib/branch-context';

export interface CallLog {
  id: string;
  date: string;
  time: string;
  name: string;
  number: string;
  type: 'Incoming' | 'Outgoing';
  duration: string; // e.g., "5m 2s"
  outcome: string; // e.g., "Interested", "Follow-up scheduled", "Not reachable"
  enquiryId?: string;
  branchId: BranchId;
}

export const mockCallLogs: CallLog[] = [
  {
    id: 'CL001',
    date: '2025-03-12',
    time: '11:34 AM',
    name: 'Vijay Kumar',
    number: '9876543210',
    type: 'Incoming',
    duration: '3m 45s',
    outcome: 'Scheduled a demo for Class 10',
    enquiryId: 'ENQ-2025-0003',
    branchId: 'BR001',
  },
  {
    id: 'CL002',
    date: '2025-03-12',
    time: '10:15 AM',
    name: 'Anitha S.',
    number: '9123456789',
    type: 'Outgoing',
    duration: '5m 12s',
    outcome: 'Follow-up call, interested in CBSE board.',
    enquiryId: 'ENQ-2025-0002',
    branchId: 'BR002',
  },
  {
    id: 'CL003',
    date: '2025-03-11',
    time: '04:50 PM',
    name: 'Rajesh Sharma',
    number: '9988776655',
    type: 'Incoming',
    duration: '2m 05s',
    outcome: 'Asked for fee structure.',
    enquiryId: 'ENQ-2025-0005',
    branchId: 'BR001',
  },
  {
    id: 'CL004',
    date: '2025-03-11',
    time: '02:30 PM',
    name: 'Priya Mehta',
    number: '9876501234',
    type: 'Outgoing',
    duration: '7m 30s',
    outcome: 'Not interested, already joined elsewhere.',
    enquiryId: 'ENQ-2025-0001',
    branchId: 'BR001',
  },
  {
    id: 'CL005',
    date: '2025-03-10',
    time: '05:00 PM',
    name: 'Suresh Iyer',
    number: '9112233445',
    type: 'Incoming',
    duration: '1m 15s',
    outcome: 'Call disconnected.',
    branchId: 'BR003',
  },
   {
    id: 'CL006',
    date: '2025-03-10',
    time: '12:00 PM',
    name: 'Deepa R.',
    number: '9567890123',
    type: 'Outgoing',
    duration: '4m 20s',
    outcome: 'Requested brochure on WhatsApp.',
    enquiryId: 'ENQ-2025-0008',
    branchId: 'BR002',
  },
];
