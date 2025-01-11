import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Clock, TrendingUp, Activity, Heart, MessageCircle, Share2, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const EngagementMetric = ({ icon: Icon, label, value, gradient }) => (
  <Card className={`bg-gradient-to-br ${gradient}`}>
    <CardContent className="pt-6">
      <div className="flex items-center gap-2">
        <Icon className="text-current opacity-70" size={20} />
        <span className="text-sm font-medium text-current opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </CardContent>
  </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <div className="space-y-1 mt-2">
          {payload.map((entry, index) => (
            <p key={index} className="text-sm">
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="ml-2">
                {entry.value >= 1000 
                  ? `${(entry.value / 1000).toFixed(1)}K` 
                  : entry.value.toFixed(0)}
              </span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const MediaContent = ({ post, username, useProxy, proxiedImageUrl, directImageUrl }) => {
  const isVideo = post.metadata.media_type === 'video';
  
  return (
    <div className="w-full h-80 relative rounded-lg overflow-hidden bg-gray-100">
      {isVideo ? (
        <div className="w-full h-full relative">
          <video
            className="w-full h-full object-contain"
            poster={useProxy ? proxiedImageUrl : directImageUrl}
            controls
          >
            <source src={post.metadata.video_url} type="video/mp4" />
            Your browser does not support video playback.
          </video>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Play className="w-12 h-12 text-white opacity-80" />
          </div>
        </div>
      ) : (
        <img
          src={useProxy ? proxiedImageUrl : directImageUrl}
          alt="Post Media"
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
};

const TopPost = ({ post, username }) => {
  const [mediaError, setMediaError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  const shortcode = post.metadata.post_id || "";
  const directImageUrl = `https://instagram.com/p/${shortcode}/media/?size=l`;



  const proxiedImageUrl = `/api/image-proxy?imageUrl=${encodeURIComponent(directImageUrl)}`;

  useEffect(() => {
    const loadMedia = async () => {
      if (post.metadata.media_type === 'video') {
        // For videos, just check if the thumbnail loads
        const img = new Image();
        img.onload = () => {
          setMediaError(false);
          setUseProxy(false);
        };
        img.onerror = () => {
          const proxyImg = new Image();
          proxyImg.onload = () => {
            setMediaError(false);
            setUseProxy(true);
          };
          proxyImg.onerror = () => {
            setMediaError(true);
            setUseProxy(false);
          };
          proxyImg.src = proxiedImageUrl;
        };
        img.src = directImageUrl;
      } else {
        // For images, check direct and proxied URLs
        const img = new Image();
        img.onload = () => {
          setMediaError(false);
          setUseProxy(false);
        };
        img.onerror = () => {
          const proxyImg = new Image();
          proxyImg.onload = () => {
            setMediaError(false);
            setUseProxy(true);
          };
          proxyImg.onerror = () => {
            setMediaError(true);
            setUseProxy(false);
          };
          proxyImg.src = proxiedImageUrl;
        };
        img.src = directImageUrl;
      }
    };

    loadMedia();
  }, [directImageUrl, proxiedImageUrl, post.metadata.media_type]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Top Performing Post</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {mediaError ? (
          <div className="w-full h-80 flex items-center justify-center text-gray-500 bg-gray-100 rounded-lg">
            <p>Unable to load media</p>
          </div>
        ) : (
          <MediaContent
            post={post}
            username={username}
            useProxy={useProxy}
            proxiedImageUrl={proxiedImageUrl}
            directImageUrl={directImageUrl}
          />
        )}

        <div className="space-y-4 mt-4">
          <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
            {username && post.metadata.post_id ? (
              <a
                href={`https://www.instagram.com/${username}/p/${post.metadata.post_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-yellow-600 hover:underline"
              >
                View Post
              </a>
            ) : (
              <span className="font-semibold text-yellow-600">
                {post.metadata.post_id || "No ID Available"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg">
              <Heart className="text-pink-500 mb-1" size={18} />
              <span className="font-semibold text-pink-600">
                {post.metadata.likes.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">Likes</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
              <MessageCircle className="text-purple-500 mb-1" size={18} />
              <span className="font-semibold text-purple-600">
                {post.metadata.comments.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">Comments</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EngagementChart = ({ posts }) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  const hourlyData = Array(24).fill(0).map((_, hour) => {
    const postsAtHour = posts.filter(post => 
      new Date(post.metadata.timestamp).getHours() === hour
    );

    const totalEngagement = postsAtHour.reduce((sum, post) => 
      sum + post.metadata.likes + post.metadata.comments, 0
    );

    const avgEngagement = postsAtHour.length > 0 
      ? totalEngagement / postsAtHour.length 
      : 0;

    return {
      hour: hour.toString().padStart(2, '0') + ':00',
      posts: postsAtHour.length,
      totalEngagement,
      avgEngagement
    };
  });

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={hourlyData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="hour"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickLine={{ stroke: '#E5E7EB' }}
            tickFormatter={(value) =>
              value >= 1_000_000
                ? `${(value / 1_000_000).toFixed(1)}M`
                : value >= 1_000
                  ? `${(value / 1_000).toFixed(1)}K`
                  : value
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="totalEngagement"
            name="Total Engagement"
            fill="#8B5CF6"
            radius={[4, 4, 0, 0]}
            onMouseEnter={(data, index) => setHoveredBar(index)}
            onMouseLeave={() => setHoveredBar(null)}
          >
            {hourlyData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={hoveredBar === index ? '#6D28D9' : '#8B5CF6'}
                className="transition-all duration-200"
                style={{
                  filter: hoveredBar === index ? 'brightness(1.1)' : 'none',
                  cursor: 'pointer'
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const Dashboard = ({ username, posts }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No data available for analysis
      </div>
    );
  }

  const topPost = posts.reduce((max, curr) =>
    curr.metadata.likes > max.metadata.likes ? curr : max, posts[0]
  );

  const totalEngagement = posts.reduce((sum, post) =>
    sum + post.metadata.likes + post.metadata.comments, 0
  );

  const averageEngagement = totalEngagement / posts.length;

  const bestHour = Array(24).fill(0).reduce((best, _, hour) => {
    const postsAtHour = posts.filter(post =>
      new Date(post.metadata.timestamp).getHours() === hour
    );
    const engagementAtHour = postsAtHour.reduce((sum, post) =>
      sum + post.metadata.likes + post.metadata.comments, 0
    );
    return engagementAtHour > best.engagement ? { hour, engagement: engagementAtHour } : best;
  }, { hour: 0, engagement: 0 }).hour;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPost post={topPost} username={username} />
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Engagement Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="engagement" className="w-full">
              <TabsList className="grid grid-cols-1 mb-8">
                <TabsTrigger value="engagement">Total Engagement</TabsTrigger>
              </TabsList>
              
              <TabsContent value="engagement">
                <EngagementChart posts={posts} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EngagementMetric
          icon={Activity}
          label="Peak Hour"
          value={`${bestHour}:00`}
          gradient="from-violet-50 to-purple-50"
        />
        <EngagementMetric
          icon={TrendingUp}
          label="Avg. Engagement"
          value={averageEngagement.toFixed(0)}
          gradient="from-emerald-50 to-teal-50"
        />
        <EngagementMetric
          icon={Clock}
          label="Total Posts"
          value={posts.length}
          gradient="from-blue-50 to-cyan-50"
        />
      </div>
    </div>
  );
};

export default Dashboard;