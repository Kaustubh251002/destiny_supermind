import React from "react";

const features = [
  {
    icon: "fa-chart-line", // Font Awesome equivalent for "graph-up"
    title: "Smart Analytics",
    desc: "Get detailed insights about your posts, audience engagement, and growth trends.",
  },
  {
    icon: "fa-solid fa-robot", // Font Awesome equivalent for "robot"
    title: "AI Assistant",
    desc: "Chat with our AI to get personalized advice and answers about your Instagram strategy.",
  },
  {
    icon: "fa-bolt", // Font Awesome equivalent for "lightning"
    title: "Content Optimization",
    desc: "Learn what works best for your audience with content performance analysis.",
  },
];

const Features = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20" id="features">
      <h2 className="text-3xl font-bold text-center mb-16">
        Powerful Features for Growth
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="card p-6 space-y-4 bg-white rounded-xl shadow-lg"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <i className={`fas ${feature.icon} text-2xl text-indigo-600`}></i>
            </div>
            <h3 className="text-xl font-semibold">{feature.title}</h3>
            <p className="text-gray-600">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
