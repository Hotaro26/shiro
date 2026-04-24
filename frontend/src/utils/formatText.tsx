import React from 'react';
import { Link } from 'react-router-dom';

export const formatText = (text: string) => {
  const parts = text.split(/(@[\w.-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const username = part.substring(1);
      return <Link key={i} to={`/profile/${username}`} style={{ color: '#007bff', textDecoration: 'none' }}>{part}</Link>;
    }
    return part;
  });
};
