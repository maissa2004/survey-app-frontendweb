import { Component, OnInit, OnDestroy, Renderer2, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, DashboardStats, DailySubmission, StatusCount, SessionSurveys, TopSurvey } from '../../../core/services/dashboard.service';
import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { io, Socket } from 'socket.io-client';
import { environment} from '../../../../environments/environment.prod';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Subscription } from 'rxjs';

import Highcharts from 'highcharts';
import 'highcharts/highcharts-3d';
Chart.register(...registerables);

interface DateRangeOption {
  label: string;
  value: string;
  days?: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private renderer = inject(Renderer2);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  // Données
    stats: DashboardStats = { totalEnqueteurs: 0, totalSurveys: 0, totalSessions: 0, totalSubmissions: 0 };
  priorStats: DashboardStats = { totalEnqueteurs: 0, totalSurveys: 0, totalSessions: 0, totalSubmissions: 0 }; 
   dailySubmissions: DailySubmission[] = [];
  statusCounts: StatusCount[] = [];
  sessionSurveys: SessionSurveys[] = [];
  topSurveys: TopSurvey[] = [];
  
  // Filtres date avancés
  dateRange = { start: '', end: '' };
  selectedRangeOption: string = '7days';
  customDays: number = 7;
  dateRangeOptions: DateRangeOption[] = [

    { label: '7 derniers jours', value: '7days', days: 7 },
    { label: '15 derniers jours', value: '15days', days: 15 },
    { label: '30 derniers jours', value: '30days', days: 30 },
    { label: '90 derniers jours', value: '90days', days: 90 },
    { label: 'Année en cours', value: 'ytd' },
    { label: 'Personnalisé', value: 'custom' }
  ];
  
  trends = {
    enqueteurs: { value: 0, direction: 'steady', label: 'stable' },
    surveys: { value: 0, direction: 'steady', label: 'stable' },
    sessions: { value: 0, direction: 'steady', label: 'stable' },
    submissions: { value: 0, direction: 'steady', label: '0%' }
  };

  
  // WebSocket
  private socket: Socket | null = null;
  private refreshInterval: any;
   isWebSocketConnected: boolean = false;
  realtimeEnabled: boolean = true;
  
  // Chart.js configurations
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { mode: 'index' }
    }
  };
  public barChartLabels: string[] = [];
  public barChartData: ChartData<'bar'> = { datasets: [{ data: [], label: 'Soumissions', backgroundColor: '#FF6A00' , borderColor: '#a44704' }] };
  public barChartType: ChartType = 'bar';
  
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };
  public pieChartData: ChartData<'pie', number[], string> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#FFC107', '#28A745', '#DC3545'] }]
  };
  public pieChartType: ChartType = 'pie';
  
  public sessionChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y'
  };
  public sessionChartLabels: string[] = [];
  public sessionChartData: ChartData<'bar'> = {
    datasets: [{ data: [], label: 'Nombre de surveys', backgroundColor: '#1A237E' }]
  };
  public sessionChartType: ChartType = 'bar';
  themeSubscription: Subscription = new Subscription;
  constructor(private dashboardService: DashboardService, private cdr: ChangeDetectorRef) {}
  user: any = null;
  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.initWebSocket();
    this.loadAllData();
    // Fallback polling si WebSocket non connecté
    this.refreshInterval = setInterval(() => {
      if (!this.isWebSocketConnected || !this.realtimeEnabled) {
        this.loadAllData();
      }
    }, 30000);

    this.themeSubscription = this.themeService.isDarkMode$.subscribe(isDark => {
      this.updateChartColorsForDarkMode(isDark);
      this.drawBarChart();      // recrée le graphique avec les nouvelles couleurs
      this.drawSessionChart();  // idem
      this.cdr.detectChanges();
    });
  }
  
  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.socket) this.socket.disconnect();
    if (this.barChart) this.barChart.destroy();
  if (this.sessionChart) this.sessionChart.destroy();
      if (this.themeSubscription) this.themeSubscription.unsubscribe();
  }
  
    // ========== TENDANCES DYNAMIQUES ==========
  // Calculer la tendance des soumissions en comparant avec la période précédente

  calculateEnqueteurTrend(): void {
    const current = this.stats.totalEnqueteurs;
    const previous = this.priorStats.totalEnqueteurs;
    const trend = this.calculateTrend(current, previous);
    this.trends.enqueteurs = {
        value: trend.value,
        direction: trend.direction,
        label: trend.label
    };
}

calculateSurveyTrend(): void {
    const current = this.stats.totalSurveys;
    const previous = this.priorStats.totalSurveys;
    const trend = this.calculateTrend(current, previous);
    this.trends.surveys = {
        value: trend.value,
        direction: trend.direction,
        label: trend.label
    };
}

calculateSessionTrend(): void {
    const current = this.stats.totalSessions;
    const previous = this.priorStats.totalSessions;
    const trend = this.calculateTrend(current, previous);
    this.trends.sessions = {
        value: trend.value,
        direction: trend.direction,
        label: trend.label
    };
}
  calculateSubmissionTrend(): void {
    const currentSum = this.dailySubmissions.reduce((sum, d) => sum + d.count, 0);
    if (currentSum === 0) {
      this.trends.submissions = { value: 0, direction: 'steady', label: '0%' };
      return;
    }

    // Période précédente (même nombre de jours)
    const startDate = new Date(this.dateRange.start || this.formatDate(this.addDays(new Date(), -7)));
    const endDate = new Date(this.dateRange.end || this.formatDate(new Date()));
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    const prevStartDate = this.addDays(startDate, -daysDiff);
    const prevEndDate = this.addDays(startDate, -1);

    this.dashboardService.getSubmissionsPerDay(
      this.formatDate(prevStartDate),
      this.formatDate(prevEndDate)
    ).subscribe(prevData => {
      const prevSum = prevData.reduce((sum, d) => sum + d.count, 0);
      const trend = this.calculateTrend(currentSum, prevSum);
      this.trends.submissions = {
        value: trend.value,
        direction: trend.direction,
        label: trend.label
      };
      this.cdr.detectChanges();
    });
  }

  calculateTrend(current: number, previous: number) {
    if (previous === 0) return { value: 100, direction: 'up', label: '+100%' };
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'steady';
    const sign = diff > 0 ? '+' : (diff < 0 ? '-' : '');
    const rounded = Math.abs(Math.round(percent));
    return {
      value: rounded,
      direction,
      label: `${sign}${rounded}%`
    };
  }
  // ==================== DARK MODE ====================
  
  
  updateChartColorsForDarkMode(isDark: boolean): void {
    // Re-créer les graphiques avec couleurs adaptées
    this.barChartData.datasets[0].backgroundColor = isDark ? '#FFB347' : '#FF6A00';
    this.barChartData.datasets[0].borderColor = isDark ? '#cc8800' : '#cc5500';
    this.pieChartData.datasets[0].backgroundColor = isDark? ['#FFB74D', '#66BB6A', '#EF5350']: ['#FFC107', '#28A745', '#DC3545'];
    this.sessionChartData.datasets[0].backgroundColor = isDark ? '#5C6BC0' : '#1A237E';

    // Forcer le refresh des charts
    this.barChartData = { ...this.barChartData };
    this.pieChartData = { ...this.pieChartData };
    this.sessionChartData = { ...this.sessionChartData };
  }
  

  
  // ==================== WEB SOCKET ====================
  initWebSocket(): void {
    try {
      this.socket = io(environment.socketUrl, { path: '/socket.io', transports: ['websocket'] });
      
      this.socket.on('connect', () => {
        console.log('WebSocket connecté');
        this.isWebSocketConnected = true;
        this.joinDashboardRoom();
      });
      
      this.socket.on('disconnect', () => {
        console.log('WebSocket déconnecté');
        this.isWebSocketConnected = false;
      });
      
      this.socket.on('dashboardUpdate', (data: any) => {
        console.log('Mise à jour temps réel reçue', data);
        this.applyRealtimeUpdate(data);
      });
      
      this.socket.on('newSubmission', (data: any) => {
        console.log('Nouvelle soumission reçue', data);
        this.loadAllData(); // Rafraîchissement complet
      });
      
    } catch (error) {
      console.error('Erreur WebSocket:', error);
      this.isWebSocketConnected = false;
    }
  }
  
  joinDashboardRoom(): void {
    if (this.socket) {
      this.socket.emit('joinDashboard', { role: 'admin' });
    }
  }
  
  applyRealtimeUpdate(data: any): void {
    if (data.stats) this.stats = { ...this.stats, ...data.stats };
    if (data.dailySubmissions) {
      this.dailySubmissions = data.dailySubmissions;
      this.updateBarChart(this.dailySubmissions);
    }
    if (data.statusCounts) {
      this.statusCounts = data.statusCounts;
      this.updatePieChart(this.statusCounts);
    }
    if (data.sessionSurveys) {
      this.sessionSurveys = data.sessionSurveys;
      this.updateSessionChart(this.sessionSurveys);
    }
    if (data.topSurveys) this.topSurveys = data.topSurveys;
  }
  
  toggleRealtime(): void {
    this.realtimeEnabled = !this.realtimeEnabled;
    if (this.realtimeEnabled && !this.isWebSocketConnected) {
      this.initWebSocket();
    }
  }

  
  // ==================== CHARGEMENT DONNÉES ====================
  loadAllData(): void {
    this.dashboardService.getStats().subscribe(data => {
            this.stats = data;
            this.calculateEnqueteurTrend();
            this.calculateSurveyTrend();
            this.calculateSessionTrend();
            this.cdr.detectChanges();
        });
    this.loadSubmissionsPerDay();
    this.dashboardService.getSubmissionsByStatus().subscribe(data => {
      this.statusCounts = data;
      this.updatePieChart(data);
      this.cdr.detectChanges();

    });
    this.dashboardService.getSurveysPerSession().subscribe({
      next: (data) => {
        this.sessionSurveys = data;
        this.updateSessionChart(data);
        this.drawSessionChart();
        this.cdr.detectChanges();
        console.log('Surveys per session:', data)},
    error: (err) => console.error('Erreur surveys per session:', err)
      
    });
    this.dashboardService.getTopSurveys().subscribe(data => this.topSurveys = data);
  }
  
  loadSubmissionsPerDay(): void {
    let start: string, end: string;
    const today = new Date();
    
    switch (this.selectedRangeOption) {
      case '7days':
        start = this.formatDate(this.addDays(today, -7));
        end = this.formatDate(today);
        break;
      case '15days':
        start = this.formatDate(this.addDays(today, -15));
        end = this.formatDate(today);
        break;
      case '30days':
        start = this.formatDate(this.addDays(today, -30));
        end = this.formatDate(today);
        break;
      case '90days':
        start = this.formatDate(this.addDays(today, -90));
        end = this.formatDate(today);
        break;
      case 'ytd':
        start = `${today.getFullYear()}-01-01`;
        end = this.formatDate(today);
        break;
      case 'custom':
        if (!this.dateRange.start || !this.dateRange.end) return;
        start = this.dateRange.start;
        end = this.dateRange.end;
        break;
      default:
        start = this.formatDate(this.addDays(today, -7));
        end = this.formatDate(today);
    }
    
    this.dashboardService.getSubmissionsPerDay(start, end).subscribe(data => {
      console.log('Nouvelles soumissions reçues:', data);
      this.dailySubmissions = data;
      this.updateBarChart(data);
      this.drawBarChart(); 
      this.calculateSubmissionTrend();
      this.cdr.detectChanges();
    });
  }
  private barChart: Chart | null = null;

  //submissions per day chart 
  private drawBarChart() {
  const canvas = document.getElementById('barChartCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  if (this.barChart) this.barChart.destroy();

  this.barChart =
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: this.barChartLabels,
      datasets: [{
        label: 'Soumissions',
        data: this.barChartData.datasets[0].data,
        backgroundColor: this.barChartData.datasets[0].backgroundColor,
        borderColor: this.barChartData.datasets[0].borderColor,
        borderWidth: 2,
        borderRadius: 8,            
        barPercentage: 0.7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: { mode: 'index' }
      },
      // Ajouter une ombre portée (simule du 3D)
      layout: {
        padding: { top: 10, bottom: 10 }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
private sessionChart: Chart | null = null;

//session per survey chart
private drawSessionChart() {
  const canvas = document.getElementById('sessionChartCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  if (this.sessionChart) this.sessionChart.destroy();
  this.sessionChart =
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: this.sessionChartLabels,
      datasets: [{
        label: 'Nombre de surveys',
        data: this.sessionChartData.datasets[0].data,
        backgroundColor: this.sessionChartData.datasets[0].backgroundColor
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',  // graphique horizontal
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}
  private updateBarChart(data: DailySubmission[]): void {
    this.barChartLabels = data.map(d => this.formatDateLabel(d.date));
    this.barChartData.datasets[0].data = data.map(d => d.count);
    this.barChartData = { ...this.barChartData };
  }
  
  private updatePieChart(data: StatusCount[]): void {
    this.pieChartData.labels = data.map(s => this.translateStatus(s.status));
    this.pieChartData.datasets[0].data = data.map(s => s.count);
    this.pieChartData = { ...this.pieChartData };
  }
  
  private updateSessionChart(data: SessionSurveys[]): void {
    this.sessionChartLabels = data.map(s => s.sessionName);
    this.sessionChartData.datasets[0].data = data.map(s => s.surveyCount);
    this.sessionChartData = { ...this.sessionChartData };
  }
  
  // ==================== FILTRES DATE ====================
  onRangeOptionChange(): void {
    if (this.selectedRangeOption !== 'custom') {
      this.loadSubmissionsPerDay();
    }
  }
  
  applyDateFilter(): void {
    if (this.dateRange.start && this.dateRange.end) {
      this.selectedRangeOption = 'custom';
      this.loadSubmissionsPerDay();
    }
  }
  
  resetDateFilter(): void {
    this.selectedRangeOption = '7days';
    this.dateRange = { start: '', end: '' };
    this.customDays = 7;
    this.loadSubmissionsPerDay();
  }
  
  // ==================== EXPORTS ====================
  exportDashboardCSV(): void {
    const rows: string[][] = [
      ['Métrique', 'Valeur'],
      [`Total Enquêteurs`, String(this.stats.totalEnqueteurs)],
      [`Total Surveys`, String(this.stats.totalSurveys)],
      [`Total Sessions`, String(this.stats.totalSessions)],
      [`Total Soumissions`, String(this.stats.totalSubmissions)],
      [],
      ['Date', 'Soumissions (par jour)']
    ];
    this.dailySubmissions.forEach(d => rows.push([d.date, String(d.count)]));
    rows.push([], ['Statut', 'Nombre']);
    this.statusCounts.forEach(s => rows.push([this.translateStatus(s.status), String(s.count)]));
    rows.push([], ['Session', 'Nombre de surveys']);
    this.sessionSurveys.forEach(s => rows.push([s.sessionName, String(s.surveyCount)]));
    
    const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_complet_${new Date().toISOString().slice(0,19)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  
  exportChartDataCSV(chartName: string): void {
    let rows: string[][];
    let filename: string;
    
    switch(chartName) {
      case 'daily':
        rows = [['Date', 'Soumissions']];
        this.dailySubmissions.forEach(d => rows.push([d.date, String(d.count)]));
        filename = `soumissions_journalieres.csv`;
        break;
      case 'status':
        rows = [['Statut', 'Nombre']];
        this.statusCounts.forEach(s => rows.push([this.translateStatus(s.status), String(s.count)]));
        filename = `repartition_statuts.csv`;
        break;
      case 'sessions':
        rows = [['Session', 'Nombre de surveys']];
        this.sessionSurveys.forEach(s => rows.push([s.sessionName, String(s.surveyCount)]));
        filename = `surveys_par_session.csv`;
        break;
      default:
        return;
    }
    
    const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.slice(0, -4)}_${new Date().toISOString().slice(0,19)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  
  async exportDashboardPDF(): Promise<void> {
    const element = document.getElementById('dashboard-content');
    if (!element) return;
    
    // Temporarily remove any transforms for cleaner capture
    const originalOverflow = element.style.overflow;
    element.style.overflow = 'visible';
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: this.themeService.getCurrentMode() ? '#1a1a2e' : '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      pdf.save(`dashboard_${new Date().toISOString().slice(0,19)}.pdf`);
    } catch (error) {
      console.error('Erreur PDF:', error);
    } finally {
      element.style.overflow = originalOverflow;
    }
  }
  
  // ==================== UTILITAIRES ====================
  translateStatus(status: string): string {
    const map: Record<string, string> = {
      'EN ATTENTE': 'En attente',
      'ACCEPTE': 'Acceptée',
      'REJETE': 'Rejetée'
    };
    return map[status] || status;
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  private formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
  
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  refresh(): void {
    this.loadAllData();
  }
}