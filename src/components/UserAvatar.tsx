interface UserAvatarProps {
  url: string | null;
  name: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
} as const;

const UserAvatar = ({ url, name, size = 'md', className = '' }: UserAvatarProps) => {
  const sizeClass = sizeMap[size];

  if (url) {
    return <img src={url} alt="" className={`${sizeClass} rounded-full object-cover ${className}`} />;
  }

  return (
    <div className={`${sizeClass} rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold ${className}`}>
      {(name || '?')[0]?.toUpperCase()}
    </div>
  );
};

export default UserAvatar;
