class ChartManager {
  constructor() {
    this.charts = new Map();
    this.currentFilters = {};
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for filter changes
    document.addEventListener('filterChanged', (event) => {
      this.currentFilters = event.detail;
      this.updateAllCharts();
    });

    // Listen for data updates
    document.addEventListener('dataUpdated', (event) => {
      this.updateAllCharts();
    });
  }

  // Initialize Proyeksi Chart
  initializeProyeksiChart() {
    const ctx = document.getElementById('proyeksiChart').getContext('2d');
    
    if (this.charts.has('proyeksi')) {
      this.charts.get('proyeksi').destroy();
    }

    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#f5f5f5' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Omzet (Rp)',
          data: [],
          borderColor: '#4fc3f7',
          backgroundColor: 'rgba(79, 195, 247, 0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          y: {
            ticks: { 
              color: textColor,
              callback: (value) => 'Rp ' + this.formatNumber(value)
            },
            grid: { color: gridColor }
          }
        },
        plugins: {
          legend: { labels: { color: textColor } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return `Rp ${this.formatNumber(value)}`;
              }
            }
          }
        }
      }
    });

    this.charts.set('proyeksi', chart);
    return chart;
  }

  // Initialize Laporan Lengkap Chart
  initializeLaporanLengkapChart() {
    const ctx = document.getElementById('laporanLengkapChart').getContext('2d');
    
    if (this.charts.has('laporanLengkap')) {
      this.charts.get('laporanLengkap').destroy();
    }

    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#f5f5f5' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Omzet',
            data: [],
            backgroundColor: 'rgba(79, 195, 247, 0.7)',
            borderColor: '#4fc3f7',
            borderWidth: 1
          },
          {
            label: 'Laba Kotor',
            data: [],
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
            borderColor: '#4caf50',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { 
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          y: {
            ticks: { 
              color: textColor,
              callback: (value) => 'Rp ' + this.formatNumber(value)
            },
            grid: { color: gridColor }
          }
        },
        plugins: {
          legend: { labels: { color: textColor } }
        }
      }
    });

    this.charts.set('laporanLengkap', chart);
    return chart;
  }

  // Initialize Arus Kas Chart
  initializeArusKasChart() {
    const ctx = document.getElementById('arusKasChart').getContext('2d');
    
    if (this.charts.has('arusKas')) {
      this.charts.get('arusKas').destroy();
    }

    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#f5f5f5' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Kas Masuk',
            data: [],
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Kas Keluar',
            data: [],
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Saldo Kas',
            data: [],
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          y: {
            ticks: { 
              color: textColor,
              callback: (value) => 'Rp ' + this.formatNumber(value)
            },
            grid: { color: gridColor }
          }
        },
        plugins: {
          legend: { labels: { color: textColor } }
        }
      }
    });

    this.charts.set('arusKas', chart);
    return chart;
  }

  // Update Proyeksi Chart with Data
  async updateProyeksiChart() {
    const chart = this.charts.get('proyeksi');
    if (!chart) return;

    const data = await this.fetchProyeksiData();
    
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.values;
    chart.update();
  }

  // Update Laporan Lengkap Chart with Data
  async updateLaporanLengkapChart() {
    const chart = this.charts.get('laporanLengkap');
    if (!chart) return;

    const data = await this.fetchLaporanLengkapData();
    
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.omzet;
    chart.data.datasets[1].data = data.labaKotor;
    chart.update();
  }

  // Update Arus Kas Chart with Data
  async updateArusKasChart() {
    const chart = this.charts.get('arusKas');
    if (!chart) return;

    const data = await this.fetchArusKasData();
    
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.kasMasuk;
    chart.data.datasets[1].data = data.kasKeluar;
    chart.data.datasets[2].data = data.saldoKas;
    chart.update();
  }

  // Fetch Data for Proyeksi Chart
  async fetchProyeksiData() {
    // Implementasi pengambilan data dari Firestore dengan filter
    const { startDate, endDate, employee } = this.currentFilters;
    
    // Contoh data dummy - akan diganti dengan data real dari Firestore
    return {
      labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
      values: [2500000, 2800000, 3200000, 3000000]
    };
  }

  // Fetch Data for Laporan Lengkap Chart
  async fetchLaporanLengkapData() {
    const { startDate, endDate, employee } = this.currentFilters;
    
    // Contoh data dummy
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
      omzet: [15000000, 16500000, 18000000, 17200000, 19000000, 18500000],
      labaKotor: [4500000, 4950000, 5400000, 5160000, 5700000, 5550000]
    };
  }

  // Fetch Data for Arus Kas Chart
  async fetchArusKasData() {
    const { startDate, endDate } = this.currentFilters;
    
    // Contoh data dummy
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
      kasMasuk: [12000000, 13500000, 15000000, 14200000, 16000000, 15500000],
      kasKeluar: [2000000, 2500000, 2200000, 2800000, 2400000, 2600000],
      saldoKas: [10000000, 11000000, 12800000, 11400000, 13600000, 12900000]
    };
  }

  // Update All Charts
  async updateAllCharts() {
    if (this.charts.has('proyeksi')) {
      await this.updateProyeksiChart();
    }
    if (this.charts.has('laporanLengkap')) {
      await this.updateLaporanLengkapChart();
    }
    if (this.charts.has('arusKas')) {
      await this.updateArusKasChart();
    }
  }

  // Change Chart Type
  changeChartType(chartName, type) {
    const chart = this.charts.get(chartName);
    if (chart) {
      chart.config.type = type;
      chart.update();
    }
  }

  // Export Chart as Image
  exportChart(chartName, format = 'png') {
    const chart = this.charts.get(chartName);
    if (chart) {
      const link = document.createElement('a');
      link.download = `chart-${chartName}-${new Date().toISOString()}.${format}`;
      link.href = chart.toBase64Image();
      link.click();
    }
  }

  // Utility Functions
  formatNumber(number) {
    return new Intl.NumberFormat('id-ID').format(number);
  }

  // Theme Update Handler
  updateChartsForTheme() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#f5f5f5' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    this.charts.forEach((chart) => {
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

  // Destroy All Charts
  destroyAllCharts() {
    this.charts.forEach((chart) => {
      chart.destroy();
    });
    this.charts.clear();
  }
}

// Initialize Chart Manager
const chartManager = new ChartManager();

// Export for use in other files
window.chartManager = chartManager;