import React from 'react';

interface ProfileImageProps {
  currentImageUrl?: string | null;
}

const ProfileImageUpload = ({ currentImageUrl }: ProfileImageProps) => {

  return (
    <div className="flex justify-center mb-16">
      <div
        className="relative w-64 h-64 rounded-full overflow-hidden"
      >
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt="Seth Gagnon - Professional headshot photo"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <img
            src="/lovable-uploads/3b57f5eb-3edf-4e7f-a4e4-293cae6f4e56.png"
            alt="Seth Gagnon - Professional headshot photo"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
    </div>
  );
};

export default ProfileImageUpload;