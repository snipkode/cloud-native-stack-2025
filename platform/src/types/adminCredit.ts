import { Transaction } from './api';

export interface CreditAdjustment {
  id: string;
  userId: string;
  adminId: string;
  adminName: string;
  operationType: 'add' | 'subtract' | 'set' | 'reset';
  amount: number;
  previousCredits: number;
  newCredits: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditAdjustmentRequest {
  amount: number;
  type: 'add' | 'subtract' | 'set';
  description?: string;
}

export interface CreditResetRequest {
  newCreditAmount: number;
  reason?: string;
}

export interface CreditHistoryResponse {
  user: {
    id: string;
    email: string;
    name: string;
    credits: number;
  };
  transactions: Transaction[];
}