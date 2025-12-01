
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, containerClassName = '', ...props }) => {
  return (
    <div className={containerClassName}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>}
      <input
        id={id}
        className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        {...props}
      />
    </div>
  );
};

export default Input;