import { z } from "zod";
import {
  AssetCategory,
  Currency,
  ExpenseCategory,
  GoalType,
  LoanType,
} from "@prisma/client";

export const assetCreateSchema = z.object({
  category: z.nativeEnum(AssetCategory),
  name: z.string().min(1).max(200),
  currency: z.nativeEnum(Currency).default(Currency.AUD),
  value: z.number().nonnegative(),
  costBasis: z.number().nonnegative().optional().nullable(),
  purchaseDate: z.string().datetime().optional().nullable(),
  details: z.record(z.string(), z.unknown()).optional().nullable(),
  source: z.string().max(64).optional(),
  notes: z.string().max(2000).optional(),
});

export const expenseCreateSchema = z.object({
  amount: z.number().positive(),
  currency: z.nativeEnum(Currency).default(Currency.AUD),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().max(500).optional(),
  date: z.string().datetime(),
  isRecurring: z.boolean().optional(),
  recurrence: z.string().max(120).optional().nullable(),
  merchant: z.string().max(120).optional().nullable(),
});

export const loanCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.nativeEnum(LoanType),
  currency: z.nativeEnum(Currency).default(Currency.AUD),
  principalOriginal: z.number().positive(),
  principalRemaining: z.number().nonnegative(),
  interestRateAnnual: z.number().min(0).max(40),
  monthlyPayment: z.number().positive(),
  startDate: z.string().datetime(),
  termMonths: z.number().int().positive().max(600),
  details: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const goalCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.nativeEnum(GoalType),
  currency: z.nativeEnum(Currency).default(Currency.AUD),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().optional(),
  targetDate: z.string().datetime().optional().nullable(),
});

export const taxProfileSchema = z.object({
  financialYear: z.string().regex(/^\d{4}-\d{2}$/),
  salaryIncome: z.number().nonnegative(),
  rentalIncome: z.number().nonnegative(),
  rentalDeductions: z.number().nonnegative(),
  otherIncome: z.number().nonnegative(),
  workDeductions: z.number().nonnegative(),
  investmentDeductions: z.number().nonnegative(),
  capitalGains: z
    .array(
      z.object({
        proceeds: z.number().nonnegative(),
        costBase: z.number().nonnegative(),
        heldDays: z.number().int().nonnegative(),
      })
    )
    .optional(),
});

export const chatSchema = z.object({
  message: z.string().min(1).max(8000),
});
