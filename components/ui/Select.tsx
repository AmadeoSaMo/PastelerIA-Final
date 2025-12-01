
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  containerClassName?: string;
  options: { value: string | number; label: string }[];
}

const Select: React.FC<SelectProps> = ({ label, id, options, containerClassName = '', ...props }) => {
  return (
    <div className={containerClassName}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>}
      <select
        id={id}
        className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
};

export default Select;