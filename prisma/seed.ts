import { PrismaClient, AssetCategory, Currency, ExpenseCategory, LoanType, GoalType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@wealth.local";
  const password = await hash("demo123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Demo Investor",
      emailVerified: new Date(),
    },
    update: { name: "Demo Investor" },
  });

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: { provider: "credentials", providerAccountId: email },
    },
    create: {
      userId: user.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: email,
      access_token: password,
    },
    update: { access_token: password },
  });

  await prisma.financialMemory.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      content:
        "Risk tolerance: balanced. Prefers ETFs and Australian super. Goal: own home in ~5 years. No crypto leverage.",
    },
    update: {},
  });

  const assetCount = await prisma.asset.count({ where: { userId: user.id } });
  if (assetCount === 0) {
    await prisma.asset.createMany({
      data: [
        {
          userId: user.id,
          category: AssetCategory.STOCK,
          name: "VAS — Australian Shares",
          currency: Currency.AUD,
          value: 42000,
          costBasis: 38000,
          details: { ticker: "VAS.AX", sector: "Broad market", quantity: 420 },
          source: "MANUAL",
        },
        {
          userId: user.id,
          category: AssetCategory.ETF,
          name: "IVV — S&P 500",
          currency: Currency.AUD,
          value: 18000,
          costBasis: 15000,
          details: { ticker: "IVV.AX", sector: "US Equities" },
          source: "MANUAL",
        },
        {
          userId: user.id,
          category: AssetCategory.GOLD,
          name: "Gold bars (investment)",
          currency: Currency.AUD,
          value: 15200,
          costBasis: 12000,
          details: {
            weightGrams: 200,
            purityKarats: 24,
            classification: "INVESTMENT",
            metal: "GOLD",
          },
          source: "METAL_API",
        },
        {
          userId: user.id,
          category: AssetCategory.SILVER,
          name: "Silver coins",
          currency: Currency.AUD,
          value: 2100,
          costBasis: 1800,
          details: {
            weightGrams: 800,
            purityKarats: 24,
            classification: "INVESTMENT",
            metal: "SILVER",
          },
          source: "MANUAL",
        },
        {
          userId: user.id,
          category: AssetCategory.PROPERTY,
          name: "Investment unit — Melbourne",
          currency: Currency.AUD,
          value: 620000,
          costBasis: 550000,
          details: { rentalIncomeAnnual: 26000, loanBalanceApprox: 380000 },
          source: "MANUAL",
        },
        {
          userId: user.id,
          category: AssetCategory.BANK_ACCOUNT,
          name: "Offset / everyday",
          currency: Currency.AUD,
          value: 18500,
          details: {},
          source: "MANUAL",
        },
        {
          userId: user.id,
          category: AssetCategory.EMERGENCY_FUND,
          name: "Emergency fund",
          currency: Currency.AUD,
          value: 24000,
          source: "MANUAL",
        },
        {
          userId: user.id,
          category: AssetCategory.SUPERANNUATION,
          name: "Super — balanced",
          currency: Currency.AUD,
          value: 198000,
          details: { fund: "Industry balanced" },
          source: "MANUAL",
        },
        {
          userId: user.id,
          category: AssetCategory.CRYPTO,
          name: "BTC",
          currency: Currency.AUD,
          value: 6500,
          costBasis: 8000,
          details: { symbol: "BTC" },
          source: "MANUAL",
        },
      ],
    });
  }

  if ((await prisma.expense.count({ where: { userId: user.id } })) === 0) {
    const now = new Date();
    const rows = [];
    for (let m = 0; m < 4; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 5);
      rows.push(
        {
          userId: user.id,
          amount: 9200,
          currency: Currency.AUD,
          category: ExpenseCategory.INCOME,
          description: "Salary",
          date: d,
        },
        {
          userId: user.id,
          amount: 2200,
          currency: Currency.AUD,
          category: ExpenseCategory.FIXED_RENT,
          description: "Rent",
          date: d,
        },
        {
          userId: user.id,
          amount: 650,
          currency: Currency.AUD,
          category: ExpenseCategory.VARIABLE_GROCERIES,
          description: "Groceries",
          date: d,
        },
        {
          userId: user.id,
          amount: 1800,
          currency: Currency.AUD,
          category: ExpenseCategory.FIXED_EMI,
          description: "Home loan",
          date: d,
        }
      );
    }
    await prisma.expense.createMany({ data: rows });
  }

  if ((await prisma.loan.count({ where: { userId: user.id } })) === 0) {
    await prisma.loan.create({
      data: {
        userId: user.id,
        name: "Investment property loan",
        type: LoanType.HOME,
        currency: Currency.AUD,
        principalOriginal: 420000,
        principalRemaining: 380000,
        interestRateAnnual: 6.1,
        monthlyPayment: 2450,
        startDate: new Date("2020-03-01"),
        termMonths: 360,
        details: { offsetLinked: true },
      },
    });
  }

  if ((await prisma.goal.count({ where: { userId: user.id } })) === 0) {
    await prisma.goal.createMany({
      data: [
        {
          userId: user.id,
          name: "House deposit",
          type: GoalType.HOME_PURCHASE,
          currency: Currency.AUD,
          targetAmount: 150000,
          currentAmount: 42000,
          targetDate: new Date("2029-12-31"),
        },
        {
          userId: user.id,
          name: "Emergency fund (6 mo)",
          type: GoalType.EMERGENCY_FUND,
          currency: Currency.AUD,
          targetAmount: 30000,
          currentAmount: 24000,
        },
      ],
    });
  }

  if ((await prisma.taxYearProfile.count({ where: { userId: user.id } })) === 0) {
    await prisma.taxYearProfile.create({
      data: {
        userId: user.id,
        financialYear: "2024-25",
        salaryIncome: 110000,
        rentalIncome: 26000,
        rentalDeductions: 31000,
        otherIncome: 1200,
        workDeductions: 2500,
        investmentDeductions: 800,
        capitalGains: [
          { proceeds: 12000, costBase: 9000, heldDays: 400 },
        ],
      },
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if ((await prisma.netWorthSnapshot.count({ where: { userId: user.id } })) === 0) {
    let nw = 720000;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      nw += 4000 + i * 150;
      await prisma.netWorthSnapshot.create({
        data: {
          userId: user.id,
          date: d,
          totalAssets: nw + 400000,
          totalDebts: 400000,
          netWorth: nw,
          inflationFactor: 1,
          currency: Currency.AUD,
        },
      });
    }
  }

  console.log("Seed complete — demo login:", email, "/ demo123 (set DEMO_AUTH=true)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
