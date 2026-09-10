
import React from 'react';

export const Hero: React.FC = () => {
    return (
        <div className="text-center py-12 md:py-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                Meet StratIQ, Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">AI Co-Founder</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                Stop guessing. Turn your business idea into a validated, investor-ready blueprint. Get your comprehensive strategy, financials, branding, and pitch deck in minutes.
            </p>
        </div>
    );
}
