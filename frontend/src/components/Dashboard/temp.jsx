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
      
      switch(timeframe) {
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

      // Rest of the metric calculations as before...
      
      return acc;
    }, {});

    // Sort keys based on timestamp
    const sortedKeys = Object.keys(timeBasedMetrics).sort((a, b) => 
      timeBasedMetrics[a].timestamp - timeBasedMetrics[b].timestamp
    );

    // Format labels based on timeframe
    const labels = sortedKeys.map(key => {
      switch(timeframe) {
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

    // Rest of the data processing as before...
    
    return {
      labels,
      // ... rest of the processed data
    };
  }, [data, timeframe, dateFilter]);

  // Update chart options for x-axis based on timeframe
  const getChartOptions = useCallback(() => {
    const baseOptions = {
      // ... existing base options
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

  // Rest of the component logic...

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white via-purple-50 to-purple-100 shadow-xl">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
      
      <div className="relative p-6 space-y-6">
        {/* Header with controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
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
        <div className="relative bg-white/50 rounded-xl p-4 shadow-inner">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="w-full h-[375px] flex items-center justify-center transition-all duration-300">
              {renderChart()}
            </div>
          </Suspense>

          {/* Navigation Buttons */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-4 pointer-events-none">
            <ChartNavButton direction="prev" onClick={handlePrevChart} />
            <ChartNavButton direction="next" onClick={handleNextChart} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceOverview;