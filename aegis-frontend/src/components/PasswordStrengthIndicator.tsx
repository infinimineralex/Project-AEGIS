import React from 'react';

interface Props {
  password: string;
}

const calculateStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1; // Special characters

  let label = 'Weak';
  let color = 'bg-red-500';

  if (score >= 4) {
    label = 'Strong';
    color = 'bg-green-500';
  } else if (score >= 2) {
    label = 'Medium';
    color = 'bg-yellow-500';
  }

  return { score, label, color };
};

const PasswordStrengthIndicator: React.FC<Props> = ({ password }) => {
  const { score, label, color } = calculateStrength(password);
  const maxScore = 5;
  const percentage = (score / maxScore) * 100;

  return (
    <div className="mt-2">
      <div className="h-2 w-full bg-gray-400 rounded">
        <div className={`h-full rounded ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-sm mt-1 text-gray-200">{label}</p>
    </div>
  );
};

export default PasswordStrengthIndicator;