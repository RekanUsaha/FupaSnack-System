// chart.js - Sistem Chart Lengkap

class ChartSystem {
    constructor() {
        this.charts = {};
        this.chartData = {};
        this.currentFilters = {};
        this.init();
    }
    
    init() {
        this.setupChartTemplates();
        this.setupEventListeners();
    }
    
    setupChartTemplates() {
        // Template konfigurasi untuk berbagai jenis chart
        this.chartTemplates = {
            line: {
                type: 'line',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            ticks: { color: this.getTextColor() },
                            grid: { color: this.getGridColor() }
                        },
                        y: {
                            ticks: { 
                                color: this.getTextColor(),
                                callback: this.getYTickCallback()
                            },
                            grid: { color: this.getGridColor() }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: this.getTextColor() }
                        },
                        tooltip: {
                            callbacks: {
                                label: this.getTooltipLabelCallback()
                            }
                        }
                    }
                }
            },
            bar: {
                type: 'bar',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            ticks: { color: this.getTextColor() },
                            grid: { color: this.getGridColor() }
                        },
                        y: {
                            ticks: { 
                                color: this.getTextColor(),
                                callback: this.getYTickCallback()
                            },
                            grid: { color: this.getGridColor() }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: this.getTextColor() }
                        }
                    }
                }
            }
        };
    }
    
    getTextColor() {
        return document.body.classList.contains('dark-mode') ? '#f5f5f5' : '#333333';
    }
    
    getGridColor() {
        return document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    }
    
    getYTickCallback() {
        return function(value) {
            if (value >= 1000000) {
                return 'Rp ' + (value / 1000000).toFixed(1) + 'Jt';
            } else if (value >= 1000) {
                return 'Rp ' + (value / 1000).toFixed(0) + 'Rb';
            }
            return 'Rp ' + value;
        };
    }
    
    getTooltipLabelCallback() {
        return function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                }).format(context.parsed.y);
            }
            return label;
        };
    }
    
    setupEventListeners() {
        // Listen untuk perubahan tema
        const observer = new MutationObserver(() => {
            this.updateChartsForTheme();
        });
        observer.observe(document.body, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
        
        // Listen untuk perubahan filter
        document.addEventListener('filterChanged', (event) => {
            this.currentFilters = event.detail;
            this.updateAllCharts();
        });
    }
    
    // === CHART MANAGEMENT ===
    
    createChart(chartId, type, data, options = {}) {
        const ctx = document.getElementById(chartId).getContext('2d');
        
        // Hancurkan chart lama jika ada
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
        }
        
        const template = this.chartTemplates[type] || this.chartTemplates.line;
        const config = {
            type: template.type,
            data: data,
            options: { ...template.options, ...options }
        };
        
        this.charts[chartId] = new Chart(ctx, config);
        return this.charts[chartId];
    }
    
    updateChart(chartId, newData) {
        if (!this.charts[chartId]) return;
        
        this.charts[chartId].data = newData;
        this.charts[chartId].update();
    }
    
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    }
    
    updateChartsForTheme() {
        const textColor = this.getTextColor();
        const gridColor = this.getGridColor();
        
        Object.values(this.charts).forEach(chart => {
            chart.options.scales.x.ticks.color = textColor;
            chart.options.scales.y.ticks.color = textColor;
            chart.options.scales.x.grid.color = gridColor;
            chart.options.scales.y.grid.color = gridColor;
            
            if (chart.options.plugins.legend) {
                chart.options.plugins.legend.labels.color = textColor;
            }
            
            chart.update();
        });
    }
    
    // === SPECIFIC CHARTS ===
    
    initializeProyeksiChart(salesData) {
        const processedData = this.processProyeksiData(salesData);
        
        const data = {
            labels: processedData.labels,
            datasets: [{
                label: 'Omzet (Rp)',
                data: processedData.omzet,
                borderColor: '#4fc3f7',
                backgroundColor: 'rgba(79, 195, 247, 0.1)',
                tension: 0.3,
                fill: true
            }]
        };
        
        return this.createChart('proyeksiChart', 'line', data);
    }
    
    initializeLaporanLengkapChart(salesData) {
        const processedData = this.processLaporanData(salesData);
        
        const data = {
            labels: processedData.labels,
            datasets: [{
                label: 'Omzet (Rp)',
                data: processedData.omzet,
                borderColor: '#4fc3f7',
                backgroundColor: 'rgba(79, 195, 247, 0.1)',
                tension: 0.3,
                fill: true
            }]
        };
        
        return this.createChart('laporanLengkapChart', 'line', data);
    }
    
    initializeArusKasChart(financialData) {
        const processedData = this.processArusKasData(financialData);
        
        const data = {
            labels: processedData.labels,
            datasets: [
                {
                    label: 'Kas Masuk (Rp)',
                    data: processedData.pemasukan,
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Kas Keluar (Rp)',
                    data: processedData.pengeluaran,
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        };
        
        return this.createChart('arusKasChart', 'line', data);
    }
    
    // === DATA PROCESSING ===
    
    processProyeksiData(salesData) {
        // Kelompokkan data berdasarkan periode (mingguan/bulanan)
        const groupedData = this.groupDataByPeriod(salesData, 'monthly');
        
        return {
            labels: groupedData.labels,
            omzet: groupedData.omzet,
            labaKotor: groupedData.labaKotor,
            totalTerjual: groupedData.totalTerjual
        };
    }
    
    processLaporanData(salesData) {
        const groupedData = this.groupDataByPeriod(salesData, 'daily');
        
        return {
            labels: groupedData.labels,
            omzet: groupedData.omzet,
            labaKotor: groupedData.labaKotor,
            totalTerjual: groupedData.totalTerjual
        };
    }
    
    processArusKasData(financialData) {
        // Proses data keuangan untuk chart arus kas
        const labels = [];
        const pemasukan = [];
        const pengeluaran = [];
        
        financialData.forEach(item => {
            labels.push(this.formatDate(item.tanggal));
            pemasukan.push(item.pemasukan || 0);
            pengeluaran.push(item.pengeluaran || 0);
        });
        
        return { labels, pemasukan, pengeluaran };
    }
    
    groupDataByPeriod(data, periodType) {
        const groups = {};
        const labels = [];
        const omzet = [];
        const labaKotor = [];
        const totalTerjual = [];
        
        data.forEach(item => {
            const period = this.getPeriodKey(item.tanggal, periodType);
            
            if (!groups[period]) {
                groups[period] = {
                    omzet: 0,
                    labaKotor: 0,
                    totalTerjual: 0
                };
                labels.push(period);
            }
            
            groups[period].omzet += item.omzet || 0;
            groups[period].labaKotor += item.labaKotor || 0;
            groups[period].totalTerjual += item.totalTerjual || 0;
        });
        
        // Urutkan berdasarkan periode
        const sortedPeriods = Object.keys(groups).sort();
        sortedPeriods.forEach(period => {
            omzet.push(groups[period].omzet);
            labaKotor.push(groups[period].labaKotor);
            totalTerjual.push(groups[period].totalTerjual);
        });
        
        return { labels: sortedPeriods, omzet, labaKotor, totalTerjual };
    }
    
    getPeriodKey(dateString, periodType) {
        const date = new Date(dateString);
        
        switch (periodType) {
            case 'daily':
                return date.toLocaleDateString('id-ID');
            case 'weekly':
                const weekNumber = this.getWeekNumber(date);
                return `Minggu ${weekNumber}`;
            case 'monthly':
                return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            case 'yearly':
                return date.getFullYear().toString();
            default:
                return date.toLocaleDateString('id-ID');
        }
    }
    
    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
    }
    
    // === FILTER HANDLING ===
    
    updateAllCharts() {
        // Trigger update untuk semua chart berdasarkan filter baru
        Object.keys(this.charts).forEach(chartId => {
            this.updateChartWithFilter(chartId);
        });
    }
    
    updateChartWithFilter(chartId) {
        // Implementasi update chart berdasarkan filter
        // Ini akan dipanggil ketika filter berubah
        console.log(`Updating chart ${chartId} with filters:`, this.currentFilters);
    }
    
    // === PUBLIC METHODS ===
    
    updateProyeksiChart(type) {
        if (!this.charts.proyeksiChart) return;
        
        const chartData = this.chartData.proyeksi || {};
        const newData = {
            ...this.charts.proyeksiChart.data,
            datasets: [{
                ...this.charts.proyeksiChart.data.datasets[0],
                data: chartData[type] || [],
                label: this.getChartLabel(type)
            }]
        };
        
        this.updateChart('proyeksiChart', newData);
    }
    
    updateLaporanLengkapChart(type) {
        if (!this.charts.laporanLengkapChart) return;
        
        const chartData = this.chartData.laporan || {};
        const newData = {
            ...this.charts.laporanLengkapChart.data,
            datasets: [{
                ...this.charts.laporanLengkapChart.data.datasets[0],
                data: chartData[type] || [],
                label: this.getChartLabel(type)
            }]
        };
        
        this.updateChart('laporanLengkapChart', newData);
    }
    
    getChartLabel(type) {
        const labels = {
            'omzet': 'Omzet (Rp)',
            'laba-kotor': 'Laba Kotor (Rp)',
            'total-terjual': 'Total Terjual'
        };
        return labels[type] || type;
    }
}

// Initialize chart system
const chartSystem = new ChartSystem();
window.chartSystem = chartSystem;