import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { format, parseISO, getWeek } from 'date-fns';
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
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

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

  const processedData = useMemo(() => {
    const validData = data.filter(post => {
      const { likes, comments, views } = post.metadata;
      return likes != null && comments != null && views != null;
    });

    // Process time-based metrics
    const timeBasedMetrics = validData.reduce((acc, post) => {
      const date = parseISO(post.metadata.timestamp);
      const weekNumber = getWeek(date);
      const key = timeframe === 'week'
        ? `${format(date, 'yyyy')}-W${weekNumber.toString().padStart(2, '0')}`
        : timeframe === 'month'
          ? format(date, 'yyyy-MM')
          : format(date, 'yyyy-MM-dd');

      if (!acc[key]) {
        acc[key] = {
          likes: 0,
          comments: 0,
          views: 0,
          count: 0,
          postTypes: {},
          engagement: 0,
          postsByTime: { morning: 0, afternoon: 0, evening: 0, night: 0 },
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

    const sortedKeys = Object.keys(timeBasedMetrics).sort((a, b) => {
      if (timeframe === 'week') {
        const [yearA, weekA] = a.split('-W');
        const [yearB, weekB] = b.split('-W');
        return yearA === yearB
          ? parseInt(weekA) - parseInt(weekB)
          : parseInt(yearA) - parseInt(yearB);
      }
      return a.localeCompare(b);
    });

    const labels = sortedKeys.map(key => {
      if (timeframe === 'week') {
        const [year, week] = key.split('-W');
        return `Week ${parseInt(week)}`;
      }
      return format(parseISO(key), 'MMM dd');
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

  return (
    <div className="glass-effect rounded-xl p-6 h-full relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{chartTitles[currentChart]}</h2>
        <select
          value={timeframe}
          onChange={handleTimeframeChange}
          className="bg-gray-700 text-white rounded p-2"
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </div>

      <Suspense fallback={<div className="w-full h-[375px] flex items-center justify-center">Loading...</div>}>
        <div className="w-full h-[375px] flex items-center justify-center transition-transform duration-300 ease-in-out">
          {renderChart()}
        </div>
      </Suspense>


      <div className="absolute top-1/2 left-0 right-0 flex justify-between transform -translate-y-1/2 px-4 pointer-events-none">
        <button
          className="bg-gray-800/80 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors pointer-events-auto"
          onClick={handlePrevChart}
          aria-label="Previous chart"
        >
          ←
        </button>
        <button
          className="bg-gray-800/80 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors pointer-events-auto"
          onClick={handleNextChart}
          aria-label="Next chart"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default PerformanceOverview;