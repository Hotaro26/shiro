import React from 'react';
import { API_URL } from '../config';

interface AvatarProps {
  url?: string;
  size?: number;
}

const UserAvatar = ({ url, size = 40 }: AvatarProps) => {
  const finalUrl = url 
    ? (url.startsWith('http') ? url : `${API_URL}${url}`)
    : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

  return (
    <img 
      src={finalUrl} 
      alt="avatar" 
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        objectFit: 'cover',
        backgroundColor: '#eee'
      }} 
    />
  );
};

export default UserAvatar;
