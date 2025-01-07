
import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, Hash, Video, Image as ImageIcon, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';


const TopPostAndEngagement = ({ posts }) => {
  if (!posts || posts.length === 0) return <div>No data available</div>;

  const getWeekNumber = (date) => {
    const currentDate = new Date(date);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor((currentDate - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
  };

  const currentWeek = getWeekNumber(new Date());
  
  // Calculate the average views from valid data
  const validViews = posts.filter(post => post.metadata.views > 0 && post.metadata.views !== null).map(post => post.metadata.views);
  const averageViews = validViews.length > 0 ? validViews.reduce((acc, view) => acc + view, 0) / validViews.length : 0;

  // Assume a fallback view-to-like ratio if no valid views data
  const fallbackViewToLikeRatio = 20;  // Or use 10:1 ratio here
  const safeViewsForPost = (views) => {
    if (views && views > 0) return views;
    if (averageViews > 0) return averageViews;
    return fallbackViewToLikeRatio;  // Fallback if no valid views
  };

  const weeklyEngagement = posts.reduce((acc, post) => {
    const postWeek = getWeekNumber(post.metadata.timestamp);
    const views = safeViewsForPost(post.metadata.views);
    const engagementRate = (post.metadata.likes / views) * 100;

    if (postWeek === currentWeek) {
      acc.current += engagementRate;
      acc.currentPosts++;
    } else if (postWeek === currentWeek - 1) {
      acc.previous += engagementRate;
      acc.previousPosts++;
    }
    return acc;
  }, { current: 0, previous: 0, currentPosts: 0, previousPosts: 0 });

  const currentEngagementRate = (weeklyEngagement.current / weeklyEngagement.currentPosts).toFixed(2);
  const previousEngagementRate = (weeklyEngagement.previous / weeklyEngagement.previousPosts).toFixed(2);
  const engagementChange = (currentEngagementRate - previousEngagementRate).toFixed(2);
  const isEngagementUp = engagementChange > 0;

  const topPost = posts.reduce((max, curr) => 
    curr.metadata.likes > max.metadata.likes ? curr : max, posts[0]);

  const postsByHour = Array(24).fill(0);
  const engagementByHour = Array(24).fill(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Check if the image URL exists and is valid (basic validation)
    const img = new Image();
    img.onload = () => setImageError(false); // If the image loads successfully
    img.onerror = () => setImageError(true); // If there's an error loading the image

    img.src = topPost.metadata.urls[0] || "";
    console.log("src=",img.src);

    return () => {
      setImageError(false); // Reset state on component unmount
    };
  }, [topPost.metadata.urls]);

  

  posts.forEach(post => {
    const hour = new Date(post.metadata.timestamp).getHours();
    postsByHour[hour]++;
    engagementByHour[hour] += post.metadata.likes;
  });

  const hourlyData = postsByHour.map((count, hour) => ({
    hour: `${hour}:00`,
    posts: count,
    engagement: engagementByHour[hour]
  }));

  const bestHour = engagementByHour.indexOf(Math.max(...engagementByHour));

  // Check if the image URL is valid
  const isValidImageUrl = (url) => {
    const img = new Image();
    img.src = url;
    return new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = () => reject(false);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Top Performing Post</h2>
        
        <div className="aspect-video relative rounded-lg overflow-hidden mb-3">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 font-semibold p-4 rounded-lg text-center">
              <p>
                Unable to render the top post image (Blocked by Instagram CORS policy). You may search the shortcode below on Google to find the top post.
              </p>
            </div>
          ) : (
            <img
              src={topPost.metadata.urls[0] || "/api/placeholder/400/400"} // fallback image if URL is empty or broken
              alt="Top Post"
              className="object-cover w-full h-full"
              style={{ objectFit: 'cover', objectPosition: 'center' }} // Ensures correct aspect ratio and image positioning
            />
          )}
        </div>
        
        <div className="space-y-2">
          <div className="text-center p-2 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
            <div className="font-semibold text-yellow-600 text-sm">
              {topPost.metadata.post_id || "No Shortcode"}
            </div>
            <div className="text-xs text-gray-500">Shortcode</div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg">
              <div className="font-semibold text-indigo-600 text-sm">
                {topPost.metadata.likes.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Likes</div>
            </div>
            <div className="text-center p-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <div className="font-semibold text-purple-600 text-sm">
                {topPost.metadata.comments.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Comments</div>
            </div>
            <div className="text-center p-2 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg">
              <div className="font-semibold text-emerald-600 text-sm">
                {((topPost.metadata.likes / safeViewsForPost(topPost.metadata.views)) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Eng. Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Analytics Overview</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="text-blue-500" size={16} />
              <span className="text-xs text-gray-600">Weekly Engagement</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-gray-800">{currentEngagementRate}%</span>
              <span className={`text-xs ${isEngagementUp ? 'text-emerald-600' : 'text-red-600'}`}>
                {isEngagementUp ? '↑' : '↓'} {Math.abs(engagementChange)}%
              </span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="text-emerald-500" size={16} />
              <span className="text-xs text-gray-600">Best Time</span>
            </div>
            <div className="text-lg font-semibold text-gray-800">{bestHour}:00</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Engagement By Hour</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyData}>
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="engagement" fill="#4B87A4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TopPostAndEngagement;

