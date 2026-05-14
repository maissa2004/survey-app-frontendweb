import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminAnswerService } from '../../../core/services/admin-answer.service';
import { registerables } from 'chart.js';
import Chart from 'chart.js/auto';
Chart.register(...registerables);

import Highcharts from 'highcharts';
import 'highcharts/highcharts-3d';

@Component({
  selector: 'app-survey-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header bg-navy text-white">
        <h5>Statistiques du survey</h5>
      </div>
      <div class="card-body">
        <div *ngIf="stats">
          <div class="row text-center mb-3">
            <div class="col-md-3"><strong>Total :</strong> {{ stats.total }}</div>
            <div class="col-md-3 text-success"><strong>Acceptées :</strong> {{ stats.accepted }}</div>
            <div class="col-md-3 text-danger"><strong>Rejetées :</strong> {{ stats.rejected }}</div>
            <div class="col-md-3 text-warning"><strong>En attente :</strong> {{ stats.pending }}</div>
          </div>
          <canvas id="statsChart"></canvas>
        </div>
      </div>
    </div>
  `,
  styles: [`.bg-navy { background-color: #001f3f; }`]
})
export class SurveyStatsComponent implements OnInit, OnDestroy {
  @Input() surveyId!: number;
  stats: any;
  chart: Chart | null = null;

  constructor(private adminService: AdminAnswerService) {}

  ngOnInit() {
    this.adminService.getStats(this.surveyId).subscribe(data => {
      this.stats = data;
      this.renderChart();
    });
  }

  renderChart() {
  const chartOptions: Highcharts.Options = {
    chart: {
      type: 'pie',
      options3d: {
        enabled: true,
        alpha: 45,
        beta: 0
      }
    },
    title: { text: undefined },
    tooltip: {
      pointFormat: '<b>{point.percentage:.1f}%</b><br/>{point.y} soumission(s)'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        depth: 35,
        dataLabels: {
          enabled: true,
          format: '{point.name} : {point.y}',
          style: { fontSize: '12px' }
        },
        showInLegend: true
      }
    },
    series: [{
      type: 'pie',
      name: 'Statut',
      data: [
        { name: 'Acceptées', y: this.stats.accepted, color: '#28a745' },
        { name: 'Rejetées', y: this.stats.rejected, color: '#dc3545' },
        { name: 'En attente', y: this.stats.pending, color: '#ffc107' }
      ]
    }]
  };
  Highcharts.chart('statsChart', chartOptions);
}

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
  }
}