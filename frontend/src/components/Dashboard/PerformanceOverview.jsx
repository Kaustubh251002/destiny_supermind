import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { format, parseISO, getWeek, isWithinInterval, startOfWeek, endOfWeek, isBefore, isAfter } from 'date-fns';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarElement,
  ArcElement,
  Legend,
  Tooltip,
  DoughnutController,
} from 'chart.js';

// Add the missing components
const LoadingSpinner = () => (
  <div className="min-h-[500px] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
  </div>
);

const ChartNavButton = ({ direction, onClick }) => (
  <button
    onClick={onClick}
    className="
      p-3 rounded-full
      bg-gradient-to-r from-purple-600/90 to-indigo-600/90
      text-white shadow-lg
      transform transition-all duration-300
      hover:scale-105 hover:shadow-xl
      active:scale-95
      disabled:opacity-50 disabled:cursor-not-allowed
      backdrop-blur-sm
      pointer-events-auto
    "
    aria-label={`${direction} chart`}
  >
    {direction === 'prev' ? '←' : '→'}
  </button>
);
// Register ChartJS components as before
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarElement,
  ArcElement,
  Legend,
  Tooltip,
  DoughnutController,
);

const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange, minDate, maxDate }) => (
  <div className="flex flex-wrap gap-2 items-center">
    <input
      type="date"
      value={startDate}
      onChange={(e) => onStartDateChange(e.target.value)}
      min={minDate}
      max={endDate}
      className="rounded-lg bg-white/80 border border-purple-200 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    />
    <span className="text-gray-500">to</span>
    <input
      type="date"
      value={endDate}
      onChange={(e) => onEndDateChange(e.target.value)}
      min={startDate}
      max={maxDate}
      className="rounded-lg bg-white/80 border border-purple-200 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    />
  </div>
);

const TimeframeSelect = ({ value, onChange }) => (
  <select
    value={value}
    onChange={onChange}
    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white shadow-md"
  >
    <option value="day">Daily</option>
    <option value="week">Weekly</option>
    <option value="month">Monthly</option>
  </select>
);
const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  animation: {
    duration: 300,
  },
  plugins: {
    legend: {
      labels: {
        usePointStyle: true,
      },
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      animation: {
        duration: 100,
      },
    },
  },
};

const lineChartOptions = {
  ...baseChartOptions,
  elements: {
    line: {
      tension: 0.2,
    },
    point: {
      radius: 0,
      hoverRadius: 4,
    },
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 10,
        maxRotation: 0,
        autoSkip: true,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        maxTicksLimit: 8,
      },
    },
  },
};

const barChartOptions = {
  ...baseChartOptions,
  scales: {
    x: {
      stacked: true,
      ticks: {
        maxTicksLimit: 10,
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
    },
  },
};

const pieChartOptions = {
  ...baseChartOptions,
  animation: {
    duration: 500,
  },
};

const doughnutChartOptions = {
  ...baseChartOptions,
  cutout: '70%',
  radius: '90%',
};

const PerformanceOverview = ({ data }) => {
  const [currentChart, setCurrentChart] = useState(0);
  const [timeframe, setTimeframe] = useState('week');

  // Get min and max dates from data
  const dateRange = useMemo(() => {
    const dates = data.map(item => parseISO(item.metadata.timestamp));
    return {
      min: format(Math.min(...dates), 'yyyy-MM-dd'),
      max: format(Math.max(...dates), 'yyyy-MM-dd')
    };
  }, [data]);

  // Initialize date filters with full range
  const [dateFilter, setDateFilter] = useState({
    start: dateRange.min,
    end: dateRange.max
  });

  const processedData = useMemo(() => {
    // Filter data based on date range
    const filteredData = data.filter(post => {
      const postDate = parseISO(post.metadata.timestamp);
      return isAfter(postDate, parseISO(dateFilter.start)) &&
        isBefore(postDate, parseISO(dateFilter.end));
    });

    const validData = filteredData.filter(post => {
      const { likes, comments, views } = post.metadata;
      return likes != null && comments != null && views != null;
    });

    // Process time-based metrics with date formatting based on timeframe
    const timeBasedMetrics = validData.reduce((acc, post) => {
      const date = parseISO(post.metadata.timestamp);
      let key;

      switch (timeframe) {
        case 'day':
          key = format(date, 'yyyy-MM-dd');
          break;
        case 'week':
          const weekStart = startOfWeek(date);
          key = format(weekStart, 'MMM d') + '-' + format(endOfWeek(date), 'd');
          break;
        case 'month':
          key = format(date, 'MMM yyyy');
          break;
        default:
          key = format(date, 'yyyy-MM-dd');
      }

      if (!acc[key]) {
        acc[key] = {
          likes: 0,
          comments: 0,
          views: 0,
          count: 0,
          postTypes: {},
          engagement: 0,
          postsByTime: { morning: 0, afternoon: 0, evening: 0, night: 0 },
          timestamp: date // Store original date for sorting
        };
      }

      // Track post types and calculate engagement rate
      const postType = post.metadata.type || 'Unknown';
      acc[key].postTypes[postType] = (acc[key].postTypes[postType] || 0) + 1;

      acc[key].likes += post.metadata.likes;
      acc[key].comments += post.metadata.comments;
      acc[key].views += post.metadata.views;
      acc[key].engagement += post.metadata.likes + post.metadata.comments;
      acc[key].count++;

      // Track posting time distribution
      const hour = parseISO(post.metadata.timestamp).getHours();
      if (hour >= 5 && hour < 12) acc[key].postsByTime.morning++;
      else if (hour >= 12 && hour < 17) acc[key].postsByTime.afternoon++;
      else if (hour >= 17 && hour < 22) acc[key].postsByTime.evening++;
      else acc[key].postsByTime.night++;

      return acc;
    }, {});


    // Process hashtag and content type metrics
    const contentTypeMetrics = {};
    const hashtagStats = validData.reduce((acc, post) => {
      const hashtags = post.metadata.hashtags || [];
      const engagement = post.metadata.likes + post.metadata.comments;
      const postType = post.metadata.type || 'Unknown';

      // Update content type metrics
      if (!contentTypeMetrics[postType]) {
        contentTypeMetrics[postType] = {
          totalPosts: 0,
          totalEngagement: 0,
        };
      }
      contentTypeMetrics[postType].totalPosts++;
      contentTypeMetrics[postType].totalEngagement += engagement;

      hashtags.forEach(tag => {
        if (!acc[tag]) {
          acc[tag] = {
            count: 0,
            totalEngagement: 0,
          };
        }
        acc[tag].count++;
        acc[tag].totalEngagement += engagement;
      });

      return acc;
    }, {});

    // Calculate engagement rates by content type
    Object.keys(contentTypeMetrics).forEach(type => {
      contentTypeMetrics[type].engagementRate =
        (contentTypeMetrics[type].totalEngagement / contentTypeMetrics[type].totalPosts).toFixed(2);
    });

    const topHashtags = Object.entries(hashtagStats)
      .sort(([, a], [, b]) => b.totalEngagement - a.totalEngagement)
      .slice(0, 5);

    const sortedKeys = Object.keys(timeBasedMetrics).sort((a, b) =>
      timeBasedMetrics[a].timestamp - timeBasedMetrics[b].timestamp
    );

    // Format labels based on timeframe
    const labels = sortedKeys.map(key => {
      switch (timeframe) {
        case 'day':
          return format(timeBasedMetrics[key].timestamp, 'MM/dd/yyyy');
        case 'week':
          return key; // Already formatted as "Jan 1-7"
        case 'month':
          return key; // Already formatted as "Jan 2024"
        default:
          return key;
      }
    });

    const allPostTypes = new Set();
    Object.values(timeBasedMetrics).forEach(dayData => {
      Object.keys(dayData.postTypes).forEach(type => allPostTypes.add(type));
    });

    const postTypeData = Array.from(allPostTypes).map(type => ({
      type,
      data: sortedKeys.map(key => timeBasedMetrics[key].postTypes[type] || 0)
    }));

    return {
      labels,
      likes: sortedKeys.map(key => Math.round(timeBasedMetrics[key].likes / timeBasedMetrics[key].count)),
      comments: sortedKeys.map(key => Math.round(timeBasedMetrics[key].comments / timeBasedMetrics[key].count)),
      views: sortedKeys.map(key => Math.round(timeBasedMetrics[key].views / timeBasedMetrics[key].count)),
      postTypes: postTypeData,
      hashtagStats: topHashtags,
      contentTypeMetrics,
      timeBasedMetrics: sortedKeys.map(key => timeBasedMetrics[key].postsByTime),
    };
  }, [data, timeframe]);

  const chartData = useMemo(() => ({
    line: {
      labels: processedData.labels,
      datasets: [
        {
          label: 'Likes',
          data: processedData.likes,
          borderColor: 'rgb(37, 99, 235)',
          fill: false,
        },
        {
          label: 'Comments',
          data: processedData.comments,
          borderColor: 'rgb(255, 159, 64)',
          fill: false,
        },
        {
          label: 'Views',
          data: processedData.views,
          borderColor: 'rgb(147, 51, 234)',
          fill: false,
        },
      ],
    },
    bar: {
      labels: processedData.labels,
      datasets: processedData.postTypes.map((typeData, index) => ({
        label: typeData.type,
        data: typeData.data,
        backgroundColor: [
          'rgba(37, 99, 235, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(52, 211, 153, 0.8)',
          'rgba(251, 146, 60, 0.8)',
        ][index % 5],
      })),
    },
    pie: {
      labels: processedData.hashtagStats.map(([tag]) => tag),
      datasets: [{
        data: processedData.hashtagStats.map(([, stats]) => stats.totalEngagement),
        backgroundColor: [
          'rgba(37, 99, 235, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(52, 211, 153, 0.8)',
          'rgba(251, 146, 60, 0.8)',
        ],
      }],
    },
    doughnut: {
      labels: Object.keys(processedData.contentTypeMetrics),
      datasets: [{
        data: Object.values(processedData.contentTypeMetrics).map(metrics =>
          parseFloat(metrics.engagementRate)
        ),
        backgroundColor: [
          'rgba(37, 99, 235, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(52, 211, 153, 0.8)',
          'rgba(251, 146, 60, 0.8)',
        ],
      }],
    },
  }), [processedData]);

  const handleNextChart = useCallback(() => {
    setCurrentChart((prev) => (prev + 1) % 4); // Updated for 4 charts
  }, []);

  const handlePrevChart = useCallback(() => {
    setCurrentChart((prev) => (prev - 1 + 4) % 4); // Updated for 4 charts
  }, []);

  const handleTimeframeChange = useCallback((e) => {
    setTimeframe(e.target.value);
  }, []);

  const chartTitles = [
    "Engagement Metrics Over Time",
    "Content Type Distribution",
    "Top Hashtags by Engagement",
    "Engagement Rate by Content Type"
  ];

  const renderChart = useCallback(() => {
    switch (currentChart) {
      case 0:
        return <Line data={chartData.line} options={lineChartOptions} />;
      case 1:
        return <Bar data={chartData.bar} options={barChartOptions} />;
      case 2:
        return <Pie data={chartData.pie} options={pieChartOptions} />;
      case 3:
        return <Doughnut data={chartData.doughnut} options={doughnutChartOptions} />;
      default:
        return null;
    }
  }, [currentChart, chartData]);

  const getChartOptions = useCallback(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 300,
      },
      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
          },
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          animation: {
            duration: 100,
          },
        },
      },
    };

    const xAxisOptions = {
      ticks: {
        maxRotation: timeframe === 'day' ? 90 : 0, // Vertical labels for daily view
        minRotation: timeframe === 'day' ? 90 : 0,
        font: {
          size: timeframe === 'day' ? 10 : 12 // Smaller font for daily view
        },
        autoSkip: true,
        maxTicksLimit: timeframe === 'day' ? 20 : 10
      }
    };

    return {
      ...baseOptions,
      scales: {
        x: xAxisOptions,
        y: {
          beginAtZero: true,
          ticks: {
            maxTicksLimit: 8
          }
        }
      }
    };
  }, [timeframe]);

  return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white via-purple-50 to-purple-100 shadow-xl w-full">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
        
        <div className="relative p-6 space-y-6 w-full">
          {/* Header with controls */}
          <div className="flex flex-col lg:flex-row justify-between items-center lg:items-center gap-4">
            <h2 className="text-xl font-bold text-black">
              {chartTitles[currentChart]}
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <TimeframeSelect value={timeframe} onChange={(e) => setTimeframe(e.target.value)} />
              
              <DateRangeSelector
                startDate={dateFilter.start}
                endDate={dateFilter.end}
                onStartDateChange={(date) => setDateFilter(prev => ({ ...prev, start: date }))}
                onEndDateChange={(date) => setDateFilter(prev => ({ ...prev, end: date }))}
                minDate={dateRange.min}
                maxDate={dateRange.max}
              />
            </div>
          </div>
  
          {/* Chart Container */}
          <div className="relative bg-white/50 rounded-xl p-4 shadow-inner w-full">
            <Suspense fallback={<LoadingSpinner />}>
              <div className="w-full h-[375px] flex items-center justify-center transition-all duration-300">
                {renderChart()}
              </div>
            </Suspense>
  
            {/* Navigation Buttons */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-4 pointer-events-none w-full">
              <ChartNavButton direction="prev" onClick={handlePrevChart} />
              <ChartNavButton direction="next" onClick={handleNextChart} />
            </div>
          </div>
        </div>
      </div>
    );
  };

export default PerformanceOverview;