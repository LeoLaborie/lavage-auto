interface AppleEmojiProps {
  name: string;
  className?: string;
}

export const AppleEmoji = ({ name, className = "w-8 h-8" }: AppleEmojiProps) => {
  return (
    <img
      src={`/emojis/${name}.png`}
      alt={name}
      className={className}
      style={{ display: 'inline-block' }}
    />
  );
};