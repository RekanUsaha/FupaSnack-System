// calculating.js - Sistem Perhitungan Lengkap

class CalculationSystem {
    constructor() {
        this.salesData = [];
        this.financialData = [];
        this.expensesData = [];
        this.salariesData = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeDefaultData();
    }

    setupEventListeners() {
        // Listen untuk perubahan data realtime
        document.addEventListener('salesDataUpdated', (event) => {
            this.salesData = event.detail;
            this.recalculateAll();
        });

        document.addEventListener('financialDataUpdated', (event) => {
            this.financialData = event.detail;
            this.recalculateAll();
        });

        document.addEventListener('expensesDataUpdated', (event) => {
            this.expensesData = event.detail;
            this.recalculateAll();
        });

        document.addEventListener('salariesDataUpdated', (event) => {
            this.salariesData = event.detail;
            this.recalculateAll();
        });
    }

    initializeDefaultData() {
        // Data default untuk testing
        this.salesData = this.getSampleSalesData();
        this.financialData = this.getSampleFinancialData();
        this.expensesData = this.getSampleExpensesData();
        this.salariesData = this.getSampleSalariesData();
    }

    // === PERHITUNGAN DASAR PENJUALAN ===

    calculateTerjual(stok, sisa) {
        const terjual = parseInt(stok) - parseInt(sisa);
        return Math.max(0, terjual); // Pastikan tidak negatif
    }

    calculateUangSupplier(terjual, hargaBeli) {
        const hargaBeliNumber = this.parseCurrency(hargaBeli);
        return terjual * hargaBeliNumber;
    }

    calculateKeuntungan(terjual, hargaJual, hargaBeli) {
        const hargaJualNumber = this.parseCurrency(hargaJual);
        const hargaBeliNumber = this.parseCurrency(hargaBeli);
        return (hargaJualNumber - hargaBeliNumber) * terjual;
    }

    calculateOmzet(terjual, hargaJual) {
        const hargaJualNumber = this.parseCurrency(hargaJual);
        return terjual * hargaJualNumber;
    }

    // === PERHITUNGAN TOTAL & AGGREGASI ===

    calculateTotalUangSupplier(salesData, supplierName = null) {
        let total = 0;
        const filteredData = supplierName ? 
            salesData.filter(sale => sale.namaSupplier === supplierName) : 
            salesData;

        filteredData.forEach(sale => {
            total += sale.uangSupplier || 0;
        });

        return total;
    }

    calculateTotalOmzet(salesData, filter = {}) {
        const filteredData = this.filterSalesData(salesData, filter);
        return filteredData.reduce((total, sale) => total + (sale.omzet || 0), 0);
    }

    calculateTotalLabaKotor(salesData, filter = {}) {
        const filteredData = this.filterSalesData(salesData, filter);
        return filteredData.reduce((total, sale) => total + (sale.labaKotor || 0), 0);
    }

    calculateTotalTerjual(salesData, filter = {}) {
        const filteredData = this.filterSalesData(salesData, filter);
        return filteredData.reduce((total, sale) => total + (sale.terjual || 0), 0);
    }

    // === PERHITUNGAN KEUANGAN KOMPREHENSIF ===

    calculateLabaBersih(totalLabaKotor, totalGaji, totalPengeluaranLain) {
        return totalLabaKotor - totalGaji - totalPengeluaranLain;
    }

    calculateKasTerbaru(kasSaatIni, labaBersih, rugi = 0) {
        return kasSaatIni + labaBersih - rugi;
    }

    calculateRugi(totalPengeluaran, totalPendapatan) {
        return Math.max(0, totalPengeluaran - totalPendapatan);
    }

    // === PROYEKSI PENJUALAN YANG AKURAT ===

    calculateProyeksiPenjualan(salesData, periode, options = {}) {
        const historicalData = this.getHistoricalData(salesData, periode);
        
        switch (options.metode) {
            case 'regresi-linear':
                return this.proyeksiRegresiLinear(historicalData, periode);
            case 'rata-rata-bergerak':
                return this.proyeksiRataRataBergerak(historicalData, options.windowSize || 3);
            case 'musiman':
                return this.proyeksiMusiman(historicalData, periode);
            default:
                return this.proyeksiRegresiLinear(historicalData, periode);
        }
    }

    proyeksiRegresiLinear(data, periode) {
        if (data.length < 2) return data;

        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        data.forEach((point, index) => {
            const x = index + 1;
            const y = point.omzet || point.total || 0;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Prediksi untuk periode berikutnya
        const nextX = n + 1;
        const prediksi = slope * nextX + intercept;

        return {
            prediksi: Math.max(0, prediksi),
            confidence: this.calculateConfidence(data, slope, intercept),
            trend: slope > 0 ? 'naik' : slope < 0 ? 'turun' : 'stabil'
        };
    }

    proyeksiRataRataBergerak(data, windowSize) {
        if (data.length < windowSize) return { prediksi: 0, confidence: 0 };

        const recentData = data.slice(-windowSize);
        const average = recentData.reduce((sum, point) => 
            sum + (point.omzet || point.total || 0), 0) / windowSize;

        return {
            prediksi: average,
            confidence: this.calculateVariance(recentData, average),
            trend: this.analyzeTrend(recentData)
        };
    }

    proyeksiMusiman(data, periode) {
        // Analisis pola musiman berdasarkan data historis
        const seasonalPatterns = this.analyzeSeasonalPatterns(data, periode);
        const lastDataPoint = data[data.length - 1];
        
        return {
            prediksi: lastDataPoint.omzet * seasonalPatterns.factor,
            confidence: seasonalPatterns.confidence,
            trend: seasonalPatterns.trend
        };
    }

    // === ANALISIS DATA UNTUK PROYEKSI ===

    analyzeSeasonalPatterns(data, periode) {
        const groupedData = this.groupByPeriod(data, periode);
        const averages = this.calculatePeriodAverages(groupedData);
        
        return {
            factor: this.calculateSeasonalFactor(averages),
            confidence: this.calculateSeasonalConfidence(averages),
            trend: this.analyzeSeasonalTrend(averages)
        };
    }

    calculateSeasonalFactor(averages) {
        const overallAverage = averages.reduce((sum, avg) => sum + avg, 0) / averages.length;
        const currentAverage = averages[averages.length - 1] || overallAverage;
        return currentAverage / overallAverage;
    }

    analyzeTrend(data) {
        if (data.length < 2) return 'stabil';
        
        const firstValue = data[0].omzet || data[0].total || 0;
        const lastValue = data[data.length - 1].omzet || data[data.length - 1].total || 0;
        
        const change = ((lastValue - firstValue) / firstValue) * 100;
        
        if (change > 5) return 'naik';
        if (change < -5) return 'turun';
        return 'stabil';
    }

    calculateConfidence(data, slope, intercept) {
        const n = data.length;
        let ssTotal = 0, ssResidual = 0;
        const meanY = data.reduce((sum, point) => sum + (point.omzet || 0), 0) / n;

        data.forEach((point, index) => {
            const x = index + 1;
            const y = point.omzet || 0;
            const yPred = slope * x + intercept;
            
            ssTotal += Math.pow(y - meanY, 2);
            ssResidual += Math.pow(y - yPred, 2);
        });

        const rSquared = 1 - (ssResidual / ssTotal);
        return Math.max(0, Math.min(1, rSquared));
    }

    calculateVariance(data, mean) {
        const variance = data.reduce((sum, point) => {
            const value = point.omzet || point.total || 0;
            return sum + Math.pow(value - mean, 2);
        }, 0) / data.length;

        return 1 - (variance / mean); // Normalized confidence
    }

    // === FILTERING DAN GROUPING DATA ===

    filterSalesData(salesData, filter) {
        let filteredData = [...salesData];

        if (filter.startDate && filter.endDate) {
            filteredData = filteredData.filter(sale => {
                const saleDate = new Date(sale.tanggal);
                return saleDate >= new Date(filter.startDate) && 
                       saleDate <= new Date(filter.endDate);
            });
        }

        if (filter.employeeId) {
            filteredData = filteredData.filter(sale => sale.ownerId === filter.employeeId);
        }

        if (filter.supplierName) {
            filteredData = filteredData.filter(sale => sale.namaSupplier === filter.supplierName);
        }

        return filteredData;
    }

    groupByPeriod(data, periodType) {
        const groups = {};
        
        data.forEach(item => {
            const key = this.getPeriodKey(item.tanggal, periodType);
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        return groups;
    }

    getPeriodKey(dateString, periodType) {
        const date = new Date(dateString);
        
        switch (periodType) {
            case 'harian':
                return date.toISOString().split('T')[0];
            case 'mingguan':
                const weekNumber = this.getWeekNumber(date);
                return `${date.getFullYear()}-W${weekNumber}`;
            case 'bulanan':
                return `${date.getFullYear()}-${date.getMonth() + 1}`;
            case 'tahunan':
                return date.getFullYear().toString();
            default:
                return date.toISOString().split('T')[0];
        }
    }

    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    getHistoricalData(salesData, periode) {
        const groupedData = this.groupByPeriod(salesData, periode);
        const historicalData = [];
        
        Object.keys(groupedData).sort().forEach(period => {
            const periodData = groupedData[period];
            const summary = this.calculatePeriodSummary(periodData);
            historicalData.push({
                periode: period,
                ...summary
            });
        });

        return historicalData;
    }

    calculatePeriodSummary(periodData) {
        return {
            omzet: periodData.reduce((sum, sale) => sum + (sale.omzet || 0), 0),
            labaKotor: periodData.reduce((sum, sale) => sum + (sale.labaKotor || 0), 0),
            totalTerjual: periodData.reduce((sum, sale) => sum + (sale.terjual || 0), 0),
            uangSupplier: periodData.reduce((sum, sale) => sum + (sale.uangSupplier || 0), 0)
        };
    }

    calculatePeriodAverages(groupedData) {
        const averages = [];
        
        Object.values(groupedData).forEach(periodData => {
            const summary = this.calculatePeriodSummary(periodData);
            averages.push(summary.omzet);
        });

        return averages;
    }

    // === UTILITY FUNCTIONS ===

    parseCurrency(currencyString) {
        if (typeof currencyString === 'number') return currencyString;
        
        const numberString = currencyString.toString().replace(/[^\d]/g, '');
        return parseInt(numberString) || 0;
    }

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

    // === RECALCULATION TRIGGER ===

    recalculateAll() {
        this.calculateFinancialSummary();
        this.calculateCashFlow();
        this.updateProjections();
        this.updateReports();
    }

    calculateFinancialSummary() {
        const totalOmzet = this.calculateTotalOmzet(this.salesData);
        const totalLabaKotor = this.calculateTotalLabaKotor(this.salesData);
        const totalGaji = this.calculateTotalSalaries();
        const totalPengeluaran = this.calculateTotalExpenses();
        const labaBersih = this.calculateLabaBersih(totalLabaKotor, totalGaji, totalPengeluaran);

        const financialSummary = {
            totalOmzet,
            totalLabaKotor,
            totalGaji,
            totalPengeluaran,
            labaBersih,
            tanggal: new Date().toISOString()
        };

        this.triggerEvent('financialSummaryCalculated', financialSummary);
        return financialSummary;
    }

    calculateCashFlow() {
        const financialSummary = this.calculateFinancialSummary();
        const kasSaatIni = this.getCurrentCash();
        const kasTerbaru = this.calculateKasTerbaru(kasSaatIni, financialSummary.labaBersih);

        const cashFlow = {
            kasSaatIni,
            kasTerbaru,
            ...financialSummary
        };

        this.triggerEvent('cashFlowCalculated', cashFlow);
        return cashFlow;
    }

    calculateTotalSalaries() {
        return this.salariesData.reduce((total, salary) => total + salary.jumlah, 0);
    }

    calculateTotalExpenses() {
        return this.expensesData.reduce((total, expense) => total + expense.jumlah, 0);
    }

    getCurrentCash() {
        // Dalam implementasi real, ini akan mengambil dari database
        return 12500000; // Default value
    }

    updateProjections() {
        const proyeksiMingguan = this.calculateProyeksiPenjualan(this.salesData, 'mingguan');
        const proyeksiBulanan = this.calculateProyeksiPenjualan(this.salesData, 'bulanan');
        
        this.triggerEvent('projectionsUpdated', {
            mingguan: proyeksiMingguan,
            bulanan: proyeksiBulanan
        });
    }

    updateReports() {
        const laporanHarian = this.generateDailyReport();
        const laporanMingguan = this.generateWeeklyReport();
        const laporanBulanan = this.generateMonthlyReport();
        
        this.triggerEvent('reportsUpdated', {
            harian: laporanHarian,
            mingguan: laporanMingguan,
            bulanan: laporanBulanan
        });
    }

    generateDailyReport() {
        const today = new Date().toISOString().split('T')[0];
        return this.filterSalesData(this.salesData, {
            startDate: today,
            endDate: today
        });
    }

    generateWeeklyReport() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return this.filterSalesData(this.salesData, {
            startDate: oneWeekAgo.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
        });
    }

    generateMonthlyReport() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        return this.filterSalesData(this.salesData, {
            startDate: oneMonthAgo.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
        });
    }

    triggerEvent(eventName, detail) {
        document.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    // === SAMPLE DATA FOR TESTING ===

    getSampleSalesData() {
        return [
            {
                id: '1',
                tanggal: '2023-06-01',
                nama: 'Supplier A',
                barang: 'Keripik Kentang',
                stok: 50,
                sisa: 15,
                terjual: 35,
                hargaBeli: 5000,
                hargaJual: 8000,
                uangSupplier: 175000,
                labaKotor: 105000,
                omzet: 280000,
                ownerId: 'employee1'
            },
            {
                id: '2',
                tanggal: '2023-06-01',
                nama: 'Supplier B',
                barang: 'Kacang Goreng',
                stok: 40,
                sisa: 22,
                terjual: 18,
                hargaBeli: 4000,
                hargaJual: 6000,
                uangSupplier: 72000,
                labaKotor: 36000,
                omzet: 108000,
                ownerId: 'employee2'
            }
        ];
    }

    getSampleFinancialData() {
        return [
            { tanggal: '2023-06-01', pemasukan: 2500000, pengeluaran: 500000 },
            { tanggal: '2023-06-02', pemasukan: 2800000, pengeluaran: 600000 }
        ];
    }

    getSampleExpensesData() {
        return [
            { id: '1', tanggal: '2023-06-01', kategori: 'Operasional', jumlah: 500000 },
            { id: '2', tanggal: '2023-06-01', kategori: 'Transportasi', jumlah: 250000 }
        ];
    }

    getSampleSalariesData() {
        return [
            { id: '1', karyawan: 'Karyawan A', jumlah: 2500000 },
            { id: '2', karyawan: 'Karyawan B', jumlah: 2500000 }
        ];
    }
}

// Initialize calculation system
const calculationSystem = new CalculationSystem();
window.calculationSystem = calculationSystem;