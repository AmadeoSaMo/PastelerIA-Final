
import React from 'react';
import { ChefHat } from 'lucide-react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`text-primary-600 flex items-center justify-center ${className}`}>
        <ChefHat className="w-full h-full" strokeWidth={1.5} />
    </div>
  );
};

export default Logo;
