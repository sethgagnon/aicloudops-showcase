import { useState, useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ProfileImageUploadProps {
  currentImageUrl?: string | null;
  onImageUpdate: (imageUrl: string) => void;
}

const ProfileImageUpload = ({ currentImageUrl, onImageUpdate }: ProfileImageUploadProps) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading } = useImageUpload();
  const { user } = useAuth();

  const handleFileSelect = async (file: File) => {
    if (!user) {
      // Show a message to sign in first
      alert('Please sign in to upload your profile picture');
      return;
    }

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      // Save the profile image URL to the user's profile
      await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          avatar_url: imageUrl,
        });
      
      onImageUpdate(imageUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const triggerFileInput = () => {
    if (!user) {
      // Could show a toast or redirect to auth, but for now just return
      alert('Please sign in to upload your profile picture');
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="flex justify-center mb-16">
      <div
        className={`relative w-64 h-64 rounded-full overflow-hidden transition-all duration-300 ${
          dragOver ? 'ring-4 ring-primary/50' : ''
        } ${uploading ? 'opacity-70' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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
        
        {/* Overlay for upload */}
        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button
            onClick={triggerFileInput}
            variant="secondary"
            size="sm"
            disabled={uploading}
            className="bg-white/90 hover:bg-white text-black"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                {user ? 'Change Photo' : 'Upload Photo'}
              </>
            )}
          </Button>
        </div>
        
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ProfileImageUpload;