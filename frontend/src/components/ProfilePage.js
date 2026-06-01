import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePrivacy } from '../privacy/PrivacyContext';

const apiBaseUrl = process.env.REACT_APP_URL_LOCAL;

const getUserImageSrc = (user) => {
  if (!user?.CheminImage) return null;
  if (user.CheminImage.startsWith('http')) return user.CheminImage;
  if (user.CheminImage.startsWith('/uploads/')) return `${apiBaseUrl}${user.CheminImage}`;
  return user.CheminImage;
};

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { getPrivacyUser } = usePrivacy();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/users/me');
        console.log('User profile data'); //console.log('User profile data:', response.data);
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        navigate('/login');
      }
    };
  
    fetchUserProfile();
  }, [navigate]);  

  if (!user) {
    return <div className="text-white">Loading...</div>;
  }

  const displayUser = getPrivacyUser(user);
  const imageSrc = getUserImageSrc(displayUser);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-white p-8 w-96">
        <h2 className="text-2xl font-bold mb-6">Votre Profil</h2>
        {imageSrc && (
          <div className='mb-6 rounded-full w-48 h-48 mx-auto overflow-hidden'>
            <img
            src={imageSrc}
            alt="Profile"
            className="h-full w-full object-cover"
          />
          </div>
        )}
        <p><strong>Surnom :</strong> <span className='italic text-sky-600'>{displayUser.Surnom}</span></p>
        <p><strong>Email :</strong> <span className='italic text-sky-600'>{user.Email}</span></p>
        <p><strong>Grade :</strong> <span className='italic text-sky-600'>{user.GradeID}</span></p>
      </div>
    </div>
  );  
};

export default ProfilePage;
