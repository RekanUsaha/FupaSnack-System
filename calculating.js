class CalculatingManager {
    constructor() {
        this.salesData = [];
        this.expensesData = [];
        this.cashFlowData = [];
        this.employeeData = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('salesDataUpdated', (event) => {
            this.salesData = event.detail;
            this.calculateAll();
        });

        document.addEventListener('expensesDataUpdated', (event) => {
            this.expensesData = event.detail;
            this.calculateAll();
        });

        document.addEventListener('cashFlowDataUpdated', (event) => {
            this.cashFlowData = event.detail;
            this.calculateAll();
        });
    }

    // MAIN CALCULATION FUNCTION
    calculateAll() {
        const calculations = {
            salesSummary: this.calculateSalesSummary(),
            financialSummary: this.calculateFinancialSummary(),
            cashFlow: this.calculateCashFlow(),
            projections: this.calculateProjections(),
            supplierPayments: this.calculateSupplierPayments(),
            employeePerformance: this.calculateEmployeePerformance()
        };

        // Dispatch event with all calculations
        document.dispatchEvent(new CustomEvent('calculationsUpdated', {
            detail: calculations
        }));

        return calculations;
    }

    // 1. BASIC SALES CALCULATIONS
    calculateSalesSummary() {
        if (!this.salesData.length) return {};

        const summary = {
            totalSold: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            averageSale: 0,
            bestSellingProduct: null,
            dailyAverage: 0
        };

        const productSales = {};
        const dailySales = {};

        this.salesData.forEach(sale => {
            const sold = sale.stok - sale.sisa;
            const revenue = sold * sale.hargaJual;
            const cost = sold * sale.hargaBeli;
            const profit = revenue - cost;

            summary.totalSold += sold;
            summary.totalRevenue += revenue;
            summary.totalCost += cost;
            summary.totalProfit += profit;

            // Product analysis
            if (!productSales[sale.barang]) {
                productSales[sale.barang] = { sold: 0, revenue: 0 };
            }
            productSales[sale.barang].sold += sold;
            productSales[sale.barang].revenue += revenue;

            // Daily analysis
            const date = new Date(sale.tanggal).toDateString();
            if (!dailySales[date]) dailySales[date] = 0;
            dailySales[date] += revenue;
        });

        // Find best selling product
        let maxSold = 0;
        for (const [product, data] of Object.entries(productSales)) {
            if (data.sold > maxSold) {
                maxSold = data.sold;
                summary.bestSellingProduct = { product, sold: data.sold, revenue: data.revenue };
            }
        }

        // Calculate averages
        summary.averageSale = summary.totalRevenue / this.salesData.length;
        summary.dailyAverage = Object.values(dailySales).reduce((a, b) => a + b, 0) / Object.keys(dailySales).length;

        return summary;
    }

    // 2. FINANCIAL CALCULATIONS
    calculateFinancialSummary() {
        const salesSummary = this.calculateSalesSummary();
        const expenses = this.calculateTotalExpenses();
        const salaries = this.calculateTotalSalaries();

        const grossProfit = salesSummary.totalProfit || 0;
        const totalExpenses = expenses.total + salaries.total;
        const netProfit = grossProfit - totalExpenses;
        const profitMargin = salesSummary.totalRevenue > 0 ? (netProfit / salesSummary.totalRevenue) * 100 : 0;

        return {
            grossProfit,
            totalExpenses,
            netProfit,
            profitMargin: Math.round(profitMargin * 100) / 100,
            operatingCostRatio: salesSummary.totalRevenue > 0 ? (totalExpenses / salesSummary.totalRevenue) * 100 : 0,
            breakEvenPoint: this.calculateBreakEvenPoint()
        };
    }

    // 3. CASH FLOW CALCULATIONS
    calculateCashFlow() {
        const currentCash = this.getCurrentCash();
        const financialSummary = this.calculateFinancialSummary();
        
        const cashIn = this.salesData.reduce((total, sale) => {
            return total + ((sale.stok - sale.sisa) * sale.hargaJual);
        }, 0);

        const cashOut = this.calculateTotalExpenses().total + this.calculateTotalSalaries().total;
        const netCashFlow = cashIn - cashOut;
        const projectedCash = currentCash + netCashFlow;

        return {
            currentCash,
            cashIn,
            cashOut,
            netCashFlow,
            projectedCash,
            cashFlowRatio: cashOut > 0 ? cashIn / cashOut : 0
        };
    }

    // 4. SALES PROJECTIONS (Advanced Algorithm)
    calculateProjections() {
        if (this.salesData.length < 7) return {}; // Need at least 7 days of data

        const dailySales = this.groupSalesByDay();
        const dates = Object.keys(dailySales).sort();
        const salesValues = dates.map(date => dailySales[date].revenue);

        // Multiple projection methods
        const movingAverage = this.calculateMovingAverage(salesValues, 7);
        const linearRegression = this.calculateLinearRegression(salesValues);
        const seasonalAdjustment = this.calculateSeasonalAdjustment(salesValues);

        // Weighted average of different methods
        const nextDayProjection = 
            (movingAverage.next * 0.4) + 
            (linearRegression.next * 0.4) + 
            (seasonalAdjustment.next * 0.2);

        const nextWeekProjection = nextDayProjection * 7;
        const nextMonthProjection = nextDayProjection * 30;

        return {
            nextDay: Math.round(nextDayProjection),
            nextWeek: Math.round(nextWeekProjection),
            nextMonth: Math.round(nextMonthProjection),
            confidence: this.calculateConfidence(salesValues),
            growthRate: this.calculateGrowthRate(salesValues),
            trend: linearRegression.trend
        };
    }

    // 5. SUPPLIER PAYMENT CALCULATIONS
    calculateSupplierPayments() {
        const supplierSummary = {};

        this.salesData.forEach(sale => {
            if (!supplierSummary[sale.nama]) {
                supplierSummary[sale.nama] = {
                    totalOwed: 0,
                    totalItems: 0,
                    products: {},
                    lastTransaction: sale.tanggal
                };
            }

            const sold = sale.stok - sale.sisa;
            const owed = sold * sale.hargaBeli;

            supplierSummary[sale.nama].totalOwed += owed;
            supplierSummary[sale.nama].totalItems += sold;

            if (!supplierSummary[sale.nama].products[sale.barang]) {
                supplierSummary[sale.nama].products[sale.barang] = 0;
            }
            supplierSummary[sale.nama].products[sale.barang] += sold;
        });

        // Calculate payment priorities
        const suppliers = Object.entries(supplierSummary).map(([name, data]) => ({
            name,
            ...data,
            priority: this.calculatePaymentPriority(data.totalOwed, data.lastTransaction)
        }));

        suppliers.sort((a, b) => b.priority - a.priority);

        return {
            totalOwed: Object.values(supplierSummary).reduce((sum, s) => sum + s.totalOwed, 0),
            suppliers: suppliers,
            averagePayment: Object.values(supplierSummary).reduce((sum, s) => sum + s.totalOwed, 0) / suppliers.length
        };
    }

    // 6. EMPLOYEE PERFORMANCE CALCULATIONS
    calculateEmployeePerformance() {
        const employeePerformance = {};

        this.salesData.forEach(sale => {
            if (!employeePerformance[sale.namaKaryawan]) {
                employeePerformance[sale.namaKaryawan] = {
                    totalSales: 0,
                    totalRevenue: 0,
                    totalProfit: 0,
                    productsSold: 0,
                    transactions: 0,
                    averageSale: 0
                };
            }

            const sold = sale.stok - sale.sisa;
            const revenue = sold * sale.hargaJual;
            const profit = revenue - (sold * sale.hargaBeli);

            employeePerformance[sale.namaKaryawan].totalSales += sold;
            employeePerformance[sale.namaKaryawan].totalRevenue += revenue;
            employeePerformance[sale.namaKaryawan].totalProfit += profit;
            employeePerformance[sale.namaKaryawan].productsSold += 1;
            employeePerformance[sale.namaKaryawan].transactions += 1;
        });

        // Calculate averages and performance metrics
        Object.keys(employeePerformance).forEach(employee => {
            const data = employeePerformance[employee];
            data.averageSale = data.totalRevenue / data.transactions;
            data.profitMargin = (data.totalProfit / data.totalRevenue) * 100;
            data.efficiency = data.totalProfit / data.productsSold;
        });

        return employeePerformance;
    }

    // ADVANCED CALCULATION METHODS
    calculateMovingAverage(data, period) {
        if (data.length < period) return { next: 0, average: 0 };

        const lastValues = data.slice(-period);
        const average = lastValues.reduce((a, b) => a + b, 0) / period;
        
        // Simple projection based on recent trend
        const trend = lastValues[lastValues.length - 1] - lastValues[0];
        const next = average + (trend / period);

        return { next, average };
    }

    calculateLinearRegression(data) {
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += data[i];
            sumXY += i * data[i];
            sumX2 += i * i;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        const next = slope * n + intercept;

        return { next, slope, intercept, trend: slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable' };
    }

    calculateSeasonalAdjustment(data) {
        // Simple weekly seasonality detection
        if (data.length < 14) return { next: 0 }; // Need 2 weeks of data

        const weeklyPattern = [];
        for (let i = 7; i < data.length; i++) {
            weeklyPattern.push(data[i] / data[i - 7]);
        }

        const avgSeasonality = weeklyPattern.reduce((a, b) => a + b, 0) / weeklyPattern.length;
        const next = data[data.length - 7] * avgSeasonality;

        return { next, seasonality: avgSeasonality };
    }

    calculateBreakEvenPoint() {
        const fixedCosts = this.calculateTotalExpenses().fixed;
        const avgProfitPerUnit = this.salesData.reduce((sum, sale) => {
            return sum + (sale.hargaJual - sale.hargaBeli);
        }, 0) / this.salesData.length;

        return avgProfitPerUnit > 0 ? Math.ceil(fixedCosts / avgProfitPerUnit) : 0;
    }

    calculateGrowthRate(data) {
        if (data.length < 2) return 0;

        const firstPeriod = data.slice(0, Math.floor(data.length / 2)).reduce((a, b) => a + b, 0);
        const secondPeriod = data.slice(Math.floor(data.length / 2)).reduce((a, b) => a + b, 0);

        return ((secondPeriod - firstPeriod) / firstPeriod) * 100;
    }

    calculateConfidence(data) {
        if (data.length < 2) return 0;

        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
        const stdDev = Math.sqrt(variance);
        const cv = (stdDev / mean) * 100; // Coefficient of variation

        // Lower CV = higher confidence
        return Math.max(0, 100 - cv);
    }

    calculatePaymentPriority(amount, lastTransaction) {
        const daysSinceTransaction = Math.floor((new Date() - new Date(lastTransaction)) / (1000 * 60 * 60 * 24));
        const amountWeight = Math.min(amount / 1000000, 1); // Normalize amount
        const timeWeight = Math.max(0, 1 - (daysSinceTransaction / 30)); // Older transactions have lower priority

        return (amountWeight * 0.7) + (timeWeight * 0.3);
    }

    // HELPER METHODS
    groupSalesByDay() {
        const dailySales = {};

        this.salesData.forEach(sale => {
            const date = new Date(sale.tanggal).toDateString();
            if (!dailySales[date]) {
                dailySales[date] = { revenue: 0, transactions: 0, items: 0 };
            }

            const sold = sale.stok - sale.sisa;
            dailySales[date].revenue += sold * sale.hargaJual;
            dailySales[date].transactions += 1;
            dailySales[date].items += sold;
        });

        return dailySales;
    }

    calculateTotalExpenses() {
        const expenses = {
            fixed: 0,
            variable: 0,
            operational: 0,
            total: 0
        };

        this.expensesData.forEach(expense => {
            expenses.total += expense.amount;
            
            if (expense.type === 'fixed') expenses.fixed += expense.amount;
            else if (expense.type === 'variable') expenses.variable += expense.amount;
            else expenses.operational += expense.amount;
        });

        return expenses;
    }

    calculateTotalSalaries() {
        // This would typically come from employee data
        const salaries = {
            total: 0,
            base: 0,
            commission: 0,
            bonus: 0
        };

        // Placeholder calculation
        salaries.total = this.employeeData.reduce((total, emp) => total + emp.salary, 0);
        
        return salaries;
    }

    getCurrentCash() {
        if (!this.cashFlowData.length) return 0;
        
        const latestCashFlow = this.cashFlowData.reduce((latest, current) => {
            return new Date(current.date) > new Date(latest.date) ? current : latest;
        });

        return latestCashFlow.balance || 0;
    }

    // REAL-TIME CALCULATION TRIGGERS
    addSale(saleData) {
        const calculatedSale = {
            ...saleData,
            terjual: this.calculateTerjual(saleData.stok, saleData.sisa),
            uangSupplier: this.calculateUangSupplier(saleData.stok, saleData.sisa, saleData.hargaBeli),
            keuntungan: this.calculateKeuntungan(saleData.stok, saleData.sisa, saleData.hargaJual, saleData.hargaBeli)
        };

        this.salesData.push(calculatedSale);
        this.calculateAll();
        
        return calculatedSale;
    }

    updateSale(saleId, updatedData) {
        const index = this.salesData.findIndex(sale => sale.id === saleId);
        if (index !== -1) {
            this.salesData[index] = {
                ...this.salesData[index],
                ...updatedData,
                terjual: this.calculateTerjual(updatedData.stok, updatedData.sisa),
                uangSupplier: this.calculateUangSupplier(updatedData.stok, updatedData.sisa, updatedData.hargaBeli),
                keuntungan: this.calculateKeuntungan(updatedData.stok, updatedData.sisa, updatedData.hargaJual, updatedData.hargaBeli)
            };
            this.calculateAll();
        }
    }

    // BASIC CALCULATION FORMULAS
    calculateTerjual(stok, sisa) {
        return stok - sisa;
    }

    calculateUangSupplier(stok, sisa, hargaBeli) {
        return (stok - sisa) * hargaBeli;
    }

    calculateKeuntungan(stok, sisa, hargaJual, hargaBeli) {
        return (stok - sisa) * (hargaJual - hargaBeli);
    }

    // UTILITY METHODS
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatNumber(number) {
        return new Intl.NumberFormat('id-ID').format(number);
    }

    parseCurrency(currencyString) {
        return parseInt(currencyString.replace(/[^\d]/g, '')) || 0;
    }
}

// Initialize Calculating Manager
const calculatingManager = new CalculatingManager();

// Export for use in other files
window.calculatingManager = calculatingManager;