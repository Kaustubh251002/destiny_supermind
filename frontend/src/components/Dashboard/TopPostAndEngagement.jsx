import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';

const TopPostAndEngagement = ({ username, posts }) => {
  if (!posts || posts.length === 0) return <div>No data available</div>;

  const [hoveredBar, setHoveredBar] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  const getWeekNumber = (date) => {
    const currentDate = new Date(date);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor((currentDate - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
  };

  const currentWeek = getWeekNumber(new Date());

  const validViews = posts.filter(post => post.metadata.views > 0 && post.metadata.views !== null).map(post => post.metadata.views);
  const averageViews = validViews.length > 0 ? validViews.reduce((acc, view) => acc + view, 0) / validViews.length : 0;

  const fallbackViewToLikeRatio = 20;
  const safeViewsForPost = (views) => {
    if (views && views > 0) return views;
    if (averageViews > 0) return averageViews;
    return fallbackViewToLikeRatio;
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
  
  const directImageUrl = topPost.metadata.urls[0] || "";
  const proxiedImageUrl = `/api/image-proxy?imageUrl=${encodeURIComponent(directImageUrl)}`;

  useEffect(() => {
    const loadImage = async () => {
      // First try loading the image directly
      const img = new Image();
      
      img.onload = () => {
        setImageError(false);
        setUseProxy(false);
      };
      
      img.onerror = () => {
        // If direct loading fails, try with proxy
        const proxyImg = new Image();
        proxyImg.onload = () => {
          setImageError(false);
          setUseProxy(true);
        };
        proxyImg.onerror = () => {
          setImageError(true);
          setUseProxy(false);
        };
        proxyImg.src = proxiedImageUrl;
      };

      img.src = directImageUrl;
    };

    loadImage();
  }, [directImageUrl, proxiedImageUrl]);

  const postsByHour = Array(24).fill(0);
  const engagementByHour = Array(24).fill(0);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Post</h2>

        <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100 mb-4">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium text-center p-4">
              <p>
                Unable to load the image. Please check the post directly using the link below.
              </p>
            </div>
          ) : (
            <img
              src={useProxy ? proxiedImageUrl : directImageUrl}
              alt="Top Post"
              className="w-full h-full"
              style={{ objectFit: 'contain', objectPosition: 'center' }}
            />
          )}
        </div>

        <div className="space-y-3">
          <div className="text-center p-2 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
            {username && topPost.metadata.post_id ? (
              <a
                href={`https://www.instagram.com/${username}/p/${topPost.metadata.post_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-yellow-600 text-sm hover:underline"
              >
                View Post
              </a>
            ) : (
              <div className="font-semibold text-yellow-600 text-sm">
                {topPost.metadata.post_id || "No Shortcode"}
              </div>
            )}
            <div className="text-xs text-gray-500">{topPost.metadata.post_id}</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg">
              <div className="font-semibold text-indigo-600">
                {topPost.metadata.likes.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Likes</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <div className="font-semibold text-purple-600">
                {topPost.metadata.comments.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Comments</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg">
              <div className="font-semibold text-emerald-600">
                {((topPost.metadata.likes / safeViewsForPost(topPost.metadata.views)) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Engagement Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 pt-5">Analytics Overview</h2>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-blue-500" size={16} />
              <span className="text-xs text-gray-600">Weekly Engagement</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-gray-800">{currentEngagementRate}%</span>
              <span className={`text-sm ${isEngagementUp ? 'text-emerald-600' : 'text-red-600'}`}>
                {isEngagementUp ? '↑' : '↓'} {Math.abs(engagementChange)}%
              </span>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-emerald-500" size={16} />
              <span className="text-xs text-gray-600">Best Time</span>
            </div>
            <div className="text-lg font-semibold text-gray-800">{bestHour}:00</div>
          </div>
        </div>

        <div className="pt-10">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Engagement By Hour</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyData}>
              <XAxis dataKey="hour" />
              <YAxis
                tickFormatter={(value) =>
                  value >= 1_000_000
                    ? `${(value / 1_000_000).toFixed(1)}M`
                    : value >= 1_000
                      ? `${(value / 1_000).toFixed(1)}K`
                      : value
                }
              />
              <Tooltip
                formatter={(value) =>
                  value >= 1_000_000
                    ? `${(value / 1_000_000).toFixed(1)}M`
                    : value >= 1_000
                      ? `${(value / 1_000).toFixed(1)}K`
                      : value
                }
              />
              <Bar dataKey="engagement" fill="#4B87B4">
                {hourlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    className="hover:scale-y-105 transition-transform duration-200 ease-in-out origin-bottom"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TopPostAndEngagement;