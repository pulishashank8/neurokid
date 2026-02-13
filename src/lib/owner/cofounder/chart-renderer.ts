/**
 * Chart Renderer for Co-Founder AI Reports
 *
 * Generates chart images that can be embedded in email reports.
 * Uses QuickChart.io API for reliable, server-side chart generation.
 */

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
  }[];
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'doughnut' | 'pie' | 'area';
  data: ChartData;
  title?: string;
  width?: number;
  height?: number;
}

/**
 * Generate a chart image URL using QuickChart.io
 * Returns a URL that can be embedded directly in email <img> tags
 */
export function generateChartImageUrl(config: ChartConfig): string {
  const { type, data, title, width = 600, height = 400 } = config;

  // Build Chart.js configuration
  const chartConfig = {
    type,
    data,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: !!title,
          text: title || '',
          color: '#ffffff',
          font: { size: 18, weight: 'bold' },
        },
        legend: {
          labels: {
            color: '#ffffff',
            font: { size: 12 },
          },
        },
      },
      scales:
        type === 'line' || type === 'bar' || type === 'area'
          ? {
              x: {
                ticks: { color: '#94a3b8' },
                grid: { color: '#334155' },
              },
              y: {
                ticks: { color: '#94a3b8' },
                grid: { color: '#334155' },
              },
            }
          : undefined,
    },
  };

  // Encode configuration for URL
  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));

  // QuickChart.io URL with dark theme background
  return `https://quickchart.io/chart?width=${width}&height=${height}&backgroundColor=%230d1117&c=${encodedConfig}`;
}

/**
 * Generate growth trend line chart
 * Shows user signups and activity over time
 */
export function generateGrowthTrendChart(data: {
  dates: string[];
  signups: number[];
  activeUsers: number[];
}): string {
  return generateChartImageUrl({
    type: 'line',
    title: 'Growth Trend (Last 7 Days)',
    data: {
      labels: data.dates,
      datasets: [
        {
          label: 'New Signups',
          data: data.signups,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
        },
        {
          label: 'Active Users',
          data: data.activeUsers,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
        },
      ],
    },
    width: 700,
    height: 350,
  });
}

/**
 * Generate revenue vs costs bar chart
 */
export function generateRevenueChart(data: {
  months: string[];
  revenue: number[];
  costs: number[];
}): string {
  return generateChartImageUrl({
    type: 'bar',
    title: 'Revenue vs Costs',
    data: {
      labels: data.months,
      datasets: [
        {
          label: 'Revenue',
          data: data.revenue,
          backgroundColor: '#10b981',
        },
        {
          label: 'Costs',
          data: data.costs,
          backgroundColor: '#ef4444',
        },
      ],
    },
    width: 600,
    height: 400,
  });
}

/**
 * Generate user activity distribution doughnut chart
 */
export function generateUserActivityChart(data: {
  active: number;
  inactive: number;
  new: number;
}): string {
  return generateChartImageUrl({
    type: 'doughnut',
    title: 'User Activity Distribution',
    data: {
      labels: ['Active Users', 'Inactive Users', 'New Users'],
      datasets: [
        {
          data: [data.active, data.inactive, data.new],
          backgroundColor: ['#10b981', '#6b7280', '#3b82f6'],
        },
      ],
    },
    width: 500,
    height: 400,
  });
}

/**
 * Generate system performance area chart
 */
export function generatePerformanceChart(data: {
  hours: string[];
  responseTime: number[];
  errorRate: number[];
}): string {
  return generateChartImageUrl({
    type: 'line',
    title: 'System Performance (Last 24 Hours)',
    data: {
      labels: data.hours,
      datasets: [
        {
          label: 'Avg Response Time (ms)',
          data: data.responseTime,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          fill: true,
        },
        {
          label: 'Error Rate (%)',
          data: data.errorRate,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          fill: true,
        },
      ],
    },
    width: 700,
    height: 350,
  });
}

/**
 * Generate engagement metrics bar chart
 */
export function generateEngagementChart(data: {
  categories: string[];
  values: number[];
}): string {
  return generateChartImageUrl({
    type: 'bar',
    title: 'Engagement Metrics',
    data: {
      labels: data.categories,
      datasets: [
        {
          label: 'Engagement Score',
          data: data.values,
          backgroundColor: [
            '#10b981',
            '#3b82f6',
            '#8b5cf6',
            '#f59e0b',
            '#ef4444',
          ],
        },
      ],
    },
    width: 600,
    height: 400,
  });
}

/**
 * Generate complete set of charts for Co-Founder email report
 */
export async function generateCoFounderReportCharts(metrics: {
  growthData: { dates: string[]; signups: number[]; activeUsers: number[] };
  revenueData?: { months: string[]; revenue: number[]; costs: number[] };
  userActivityData: { active: number; inactive: number; new: number };
  performanceData: { hours: string[]; responseTime: number[]; errorRate: number[] };
  engagementData: { categories: string[]; values: number[] };
}): Promise<{
  growthChart: string;
  revenueChart?: string;
  activityChart: string;
  performanceChart: string;
  engagementChart: string;
}> {
  return {
    growthChart: generateGrowthTrendChart(metrics.growthData),
    revenueChart: metrics.revenueData
      ? generateRevenueChart(metrics.revenueData)
      : undefined,
    activityChart: generateUserActivityChart(metrics.userActivityData),
    performanceChart: generatePerformanceChart(metrics.performanceData),
    engagementChart: generateEngagementChart(metrics.engagementData),
  };
}

/**
 * Helper: Get sample data for testing chart generation
 */
export function getSampleChartData() {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const last24Hours = Array.from({ length: 24 }, (_, i) => {
    return `${i}:00`;
  });

  return {
    growthData: {
      dates: last7Days,
      signups: [12, 18, 15, 22, 19, 25, 30],
      activeUsers: [145, 152, 148, 160, 158, 165, 172],
    },
    revenueData: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      revenue: [5000, 7000, 8500, 9200, 11000, 12500],
      costs: [3000, 3500, 4000, 4200, 4800, 5200],
    },
    userActivityData: {
      active: 172,
      inactive: 58,
      new: 30,
    },
    performanceData: {
      hours: last24Hours,
      responseTime: Array.from({ length: 24 }, () => Math.random() * 200 + 100),
      errorRate: Array.from({ length: 24 }, () => Math.random() * 2),
    },
    engagementData: {
      categories: ['Posts', 'Comments', 'Likes', 'Shares', 'Sessions'],
      values: [245, 567, 892, 123, 1250],
    },
  };
}
