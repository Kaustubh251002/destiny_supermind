import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, Hash, Video, Image as ImageIcon, TrendingUp, ArrowUp, ArrowDown, Download } from 'lucide-react';

const TopPostAndEngagement = ({ posts }) => {
  const [imageData, setImageData] = useState(null);
  const [imageError, setImageError] = useState(false);

  // ... (keep all the existing calculations and functions)

  const downloadAndDisplayImage = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setImageData(objectUrl);
      setImageError(false);

      // Create a temporary link to trigger download
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `post-${topPost.metadata.post_id || 'image'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up the object URL after a short delay to ensure the download starts
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch (error) {
      console.error('Error downloading image:', error);
      setImageError(true);
    }
  };

  useEffect(() => {
    if (topPost?.metadata?.urls?.[0]) {
      downloadAndDisplayImage(topPost.metadata.urls[0]);
    }
  }, [topPost?.metadata?.urls]);

  // In the JSX, update the image section:
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold text-gray-800">Top Performing Post</h2>
          {topPost?.metadata?.urls?.[0] && (
            <button 
              onClick={() => downloadAndDisplayImage(topPost.metadata.urls[0])}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              <Download size={16} />
              Download
            </button>
          )}
        </div>
        
        <div className="aspect-video relative rounded-lg overflow-hidden mb-3">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 font-semibold p-4 rounded-lg text-center">
              <p>
                Unable to render the top post image. You may search the shortcode below on Google to find the top post.
              </p>
            </div>
          ) : (
            <img
              src={imageData || topPost.metadata.urls[0] || "/api/placeholder/400/400"}
              alt="Top Post"
              className="object-cover w-full h-full"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          )}
        </div>

        {/* ... rest of the component remains the same ... */}
      </div>
      {/* ... rest of the component remains the same ... */}
    </div>
  );
};

export default TopPostAndEngagement;