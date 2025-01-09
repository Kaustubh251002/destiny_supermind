import React, { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, Line, PieChart, Pie } from 'recharts';
import { TrendingUp, Activity, Heart, MessageCircle, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { subMonths, parseISO, format, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns';

const calculateInitialDateRange = (data) => {
  try {
    const sortedDates = [...data]
      .filter((item) => item?.metadata?.timestamp)
      .sort((a, b) => new Date(a.metadata.timestamp) - new Date(b.metadata.timestamp));

    if (sortedDates.length === 0) {
      const today = new Date();
      return {
        from: subMonths(today, 12),
        to: today,
      };
    }

    const firstDate = parseISO(sortedDates[0].metadata.timestamp);
    const lastDate = parseISO(sortedDates[sortedDates.length - 1].metadata.timestamp);

    return {
      from: firstDate,
      to: lastDate,
    };
  } catch (error) {
    console.error("Error calculating initial date range:", error);
    const today = new Date();
    return {
      from: subMonths(today, 12),
      to: today,
    };
  }
};


const DatePickerWithRange = ({ dateRange, onDateRangeChange }) => {
  if (!dateRange?.from || !dateRange?.to) return null;

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[300px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from && dateRange.to ? (
              <>
                {format(dateRange.from, "LLL dd, y")} -{" "}
                {format(dateRange.to, "LLL dd, y")}
              </>
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const CustomXAxisTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} 
        y={0} 
        dy={16} 
        textAnchor="end" 
        fill="#666"
        transform="rotate(-35)"
        style={{ fontSize: '10px' }}
      >
        {payload.value}
      </text>
    </g>
  );
};

const CustomYAxisTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="#666"
        style={{ fontSize: '10px' }}
      >
        {payload.value}
      </text>
    </g>
  );
};

const PerformanceOverview = ({ data }) => {
  // Ensure data is valid and not empty
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <p className="text-lg text-gray-500">No data available</p>
      </div>
    );
  }
  
  const [timeframe, setTimeframe] = useState('week');
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState(calculateInitialDateRange(data));
  
  // Update dateRange when data changes
  useEffect(() => {
    const newDateRange = calculateInitialDateRange(data);
    setDateRange(newDateRange);
  }, [data]);
  

  // If date range is not properly initialized, show error state
  if (!dateRange?.from || !dateRange?.to) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <p className="text-lg text-gray-500">Invalid date range in data</p>
      </div>
    );
  }

  const processedData = useMemo(() => {
    // Filter data based on date range
    const filteredData = data.filter(post => {
      const postDate = parseISO(post.metadata.timestamp);
      return isWithinInterval(postDate, { start: dateRange.from, end: dateRange.to });
    });

    // Group data based on timeframe
    const groupedTimeData = filteredData.reduce((acc, post) => {
      const date = parseISO(post.metadata.timestamp);
      let key;
      let displayDate;

      if (timeframe === 'day') {
        key = format(date, 'yyyy-MM-dd');
        displayDate = format(date, "MMM dd ''yy"); // Updated format to include year
      } else if (timeframe === 'week') {
        const weekStart = startOfWeek(date);
        key = format(weekStart, 'yyyy-MM-dd');
        displayDate = `Week of ${format(weekStart, "MMM dd ''yy")}`; // Updated format to include year
      } else if (timeframe === 'month') {
        const monthStart = startOfMonth(date);
        key = format(monthStart, 'yyyy-MM');
        displayDate = format(monthStart, "MMM ''yy"); // Updated format to include year
      }

      if (!acc[key]) {
        acc[key] = {
          date: displayDate,
          likes: 0,
          comments: 0,
          posts: 0,
          engagement: 0,
          timestamp: date,
          contentTypes: {}
        };
      }

      const type = post.metadata.type || 'Other';
      if (!acc[key].contentTypes[type]) {
        acc[key].contentTypes[type] = {
          posts: 0,
          likes: 0,
          comments: 0,
          engagement: 0
        };
      }

      acc[key].likes += post.metadata.likes || 0;
      acc[key].comments += post.metadata.comments || 0;
      acc[key].engagement += (post.metadata.likes || 0) + (post.metadata.comments || 0);
      acc[key].posts++;

      acc[key].contentTypes[type].posts++;
      acc[key].contentTypes[type].likes += post.metadata.likes || 0;
      acc[key].contentTypes[type].comments += post.metadata.comments || 0;
      acc[key].contentTypes[type].engagement += (post.metadata.likes || 0) + (post.metadata.comments || 0);

      return acc;
    }, {});

    // Convert grouped time data to array and calculate averages
    const timeMetrics = Object.values(groupedTimeData)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(metric => ({
        ...metric,
        likes: metric.posts ? Math.round(metric.likes / metric.posts) : 0,
        comments: metric.posts ? Math.round(metric.comments / metric.posts) : 0,
        engagement: metric.posts ? Math.round(metric.engagement / metric.posts) : 0
      }));

    // Calculate aggregated content type metrics for the selected timeframe
    const contentMetrics = Object.values(groupedTimeData).reduce((acc, period) => {
      Object.entries(period.contentTypes).forEach(([type, metrics]) => {
        if (!acc[type]) {
          acc[type] = {
            type,
            posts: 0,
            totalLikes: 0,
            totalComments: 0,
            engagement: 0,
            periods: 0
          };
        }
        acc[type].posts += metrics.posts;
        acc[type].totalLikes += metrics.likes;
        acc[type].totalComments += metrics.comments;
        acc[type].engagement += metrics.engagement;
        acc[type].periods++;
      });
      return acc;
    }, {});

    const contentTypes = Object.values(contentMetrics)
      .map(item => ({
        ...item,
        averageLikes: Math.round(item.totalLikes / item.posts),
        averageComments: Math.round(item.totalComments / item.posts),
        engagementRate: Math.round((item.engagement / (item.posts * item.periods)) * 100) / 100,
        postsPerPeriod: Math.round((item.posts / item.periods) * 100) / 100
      }));

    return {
      timeMetrics,
      contentTypes
    };
  }, [data, timeframe, dateRange]);

  const calculateXAxisInterval = () => {
    const dataLength = processedData.timeMetrics.length;
    if (dataLength <= 10) return 0;
    if (dataLength <= 20) return 1;
    if (dataLength <= 30) return 2;
    return Math.floor(dataLength / 10);
  };

  const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#9333ea', '#06b6d4'];
  const chartConfig = {
    fontSize: 10,
    margin: { top: 5, right: 20, left: 10, bottom: 45 }
  };

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart 
        data={processedData.timeMetrics}
        margin={chartConfig.margin}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          height={60}
          tick={<CustomXAxisTick />}
          interval={calculateXAxisInterval()}
          fontSize={chartConfig.fontSize}
        />
        <YAxis 
          tick={<CustomYAxisTick />}
          fontSize={chartConfig.fontSize}
          width={35}
        />
        <Tooltip 
          formatter={(value, name) => [`${value}`, name]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Line 
          type="monotone" 
          dataKey="likes" 
          stroke="#4f46e5" 
          name="Avg Likes"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="comments" 
          stroke="#7c3aed" 
          name="Avg Comments"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderContentPerformance = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={processedData.contentTypes}
        margin={chartConfig.margin}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="type" 
          tick={<CustomXAxisTick />}
          fontSize={chartConfig.fontSize}
        />
        <YAxis 
          tick={<CustomYAxisTick />}
          fontSize={chartConfig.fontSize}
          width={35}
        />
        <Tooltip 
          formatter={(value, name) => [
            `${value}${name === 'Posts per Period' ? ' posts' : ''}`, 
            name
          ]}
        />
        <Bar 
          dataKey="engagementRate" 
          name={`Avg. Engagement per ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`}
        >
          {processedData.contentTypes.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderEngagementPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={processedData.contentTypes}
          dataKey="engagement"
          nameKey="type"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ type, engagement }) => 
            `${type}: ${Math.round(engagement / processedData.timeMetrics.length)}`
          }
        >
          {processedData.contentTypes.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name, props) => [
            Math.round(value / processedData.timeMetrics.length),
            `${props.payload.type} Engagement/${timeframe}`
          ]}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderPostsDistribution = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={processedData.contentTypes}
        margin={chartConfig.margin}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="type" 
          tick={<CustomXAxisTick />}
          fontSize={chartConfig.fontSize}
        />
        <YAxis 
          tick={<CustomYAxisTick />}
          fontSize={chartConfig.fontSize}
          width={35}
        />
        <Tooltip 
          formatter={(value, name) => [`${value} posts`, name]}
        />
        <Bar 
          dataKey="postsPerPeriod" 
          name={`Posts per ${timeframe}`}
        >
          {processedData.contentTypes.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold"></h1>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">
          <DatePickerWithRange 
            dateRange={dateRange}
            onDateRangeChange={(newRange) => {
              if (newRange?.from && newRange?.to) {
                setDateRange(newRange);
              }
            }}
          />
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Engagement Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderLineChart()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Content Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderContentPerformance()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Average Engagement by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderEngagementPieChart()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Posts Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderPostsDistribution()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceOverview;