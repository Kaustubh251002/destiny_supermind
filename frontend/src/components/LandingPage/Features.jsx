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
    <section className="max-w-7xl mx-auto px-6 py-24" id="features">
      <h2 className="text-4xl font-bold text-center mb-20 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
        Powerful Features for Growth
      </h2>
      <div className="grid md:grid-cols-3 gap-12">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group p-8 space-y-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i className={`fas ${feature.icon} text-2xl text-indigo-600 group-hover:animate-bounce`}></i>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800">{feature.title}</h3>
            <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
